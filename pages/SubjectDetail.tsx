import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookMarked,
  FileText,
  Upload,
  MessageSquareText,
  BrainCircuit,
  Settings,
  Clock,
  Trash2,
  ExternalLink,
  History,
  Trophy,
  Plus,
  X,
  RefreshCw,
  Pencil,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { aiApi, conversationApi, documentApi, quizApi, subjectApi } from "../services/api";
import {
  Document,
  InteractionResponse,
  QuizHistoryResponse,
  Subject,
  SubjectInput,
  ConversationSummary,
} from "../types";

const DEFAULT_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#475569",
];
const MAX_UPLOAD_FILES = 4;
const MAX_QUIZ_DOCS = 3;

type Tab = "docs" | "chats" | "quizzes";

interface FlatInteraction extends InteractionResponse {
  docId: number;
  docName: string;
}

const SubjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const subjectId = Number(id);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [chats, setChats] = useState<FlatInteraction[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [quizzes, setQuizzes] = useState<QuizHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<Tab>("docs");
  const [editing, setEditing] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    const term = docSearch.trim().toLowerCase();
    if (!term) return docs;
    return docs.filter((d) => d.fileName.toLowerCase().includes(term));
  }, [docs, docSearch]);

  useEffect(() => {
    if (!subjectId || Number.isNaN(subjectId)) {
      navigate("/subjects", { replace: true });
      return;
    }
    fetchAll();
  }, [subjectId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subjectRes, docsRes, quizRes, convRes] = await Promise.all([
        subjectApi.getById(subjectId),
        documentApi.getAll({ subjectId }),
        quizApi.getHistory(),
        conversationApi.list(subjectId).catch(() => null),
      ]);
      const subj = subjectRes.data.data;
      const docList = docsRes.data.data;
      setSubject(subj);
      setDocs(docList);
      setConversations(convRes?.data.data ?? []);

      const docIdSet = new Set(docList.map((d) => d.id));
      const subjectQuizzes = (quizRes.data.data ?? []).filter((q) =>
        q.sourceDocumentIds?.some((sid) => docIdSet.has(sid))
      );
      setQuizzes(subjectQuizzes);

      if (docList.length > 0) {
        const allChats = await Promise.all(
          docList.map((d) =>
            aiApi
              .getChatHistory(d.id)
              .then((r) =>
                r.data.data.map((i): FlatInteraction => ({
                  ...i,
                  docId: d.id,
                  docName: d.fileName,
                }))
              )
              .catch(() => [] as FlatInteraction[])
          )
        );
        const flat = allChats.flat().sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setChats(flat);
      } else {
        setChats([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không tải được dữ liệu môn học");
      navigate("/subjects", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (files.length > MAX_UPLOAD_FILES) {
      toast.error(`Mỗi lần upload tối đa ${MAX_UPLOAD_FILES} file. Đã chọn ${files.length}.`);
      return;
    }
    const nonPdf = files.find((f) => f.type !== "application/pdf");
    if (nonPdf) {
      toast.error(`File "${nonPdf.name}" không phải PDF.`);
      return;
    }

    setUploading(true);
    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append("file", files[0]);
        formData.append("subjectId", String(subjectId));
        await documentApi.upload(formData);
      } else {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("subjectId", String(subjectId));
        await documentApi.uploadBatch(formData);
      }
      toast.success(`Đã tải lên ${files.length} tài liệu vào "${subject?.name}"`);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tải lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number, fileName: string) => {
    if (!window.confirm(`Xóa tài liệu "${fileName}"? Tất cả chat/quiz liên quan cũng mất.`)) return;
    try {
      await documentApi.delete(docId);
      toast.success("Đã xóa tài liệu");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không xóa được");
    }
  };

  const handleDeleteConversation = async (convId: number, title: string) => {
    if (!window.confirm(`Xóa phiên chat "${title}"? Không khôi phục được.`)) return;
    try {
      await conversationApi.delete(convId);
      toast.success("Đã xóa phiên chat");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không xóa được phiên chat");
    }
  };

  const handleStartMultiChat = () => {
    if (docs.length === 0) {
      toast.error("Môn này chưa có tài liệu để chat");
      return;
    }

    const ids = docs.map((d) => d.id).join(",");
    navigate(`/study-multi?docIds=${ids}&subjectId=${subjectId}`);
  };

  const handleStartQuiz = () => {
    if (docs.length === 0) {
      toast.error("Môn này chưa có tài liệu để tạo quiz");
      return;
    }
    const ids = docs.map((d) => d.id).join(",");
    navigate(`/quizzes?docIds=${ids}`);
  };

  const avgQuizScore = useMemo(() => {
    if (quizzes.length === 0) return null;
    return (quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length).toFixed(1);
  }, [quizzes]);

  const lastActivity = useMemo(() => {
    const all: Date[] = [];
    if (subject) all.push(new Date(subject.createdAt));
    docs.forEach((d) => all.push(new Date(d.createdAt)));
    chats.forEach((c) => all.push(new Date(c.createdAt)));
    quizzes.forEach((q) => all.push(new Date(q.completedAt)));
    if (all.length === 0) return null;
    return new Date(Math.max(...all.map((d) => d.getTime())));
  }, [subject, docs, chats, quizzes]);

  const formatRelative = (d: Date | null) => {
    if (!d) return "—";
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <RefreshCw className="animate-spin text-blue-600 mr-2" />
        <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
          Đang tải môn học...
        </span>
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/subjects"
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            Tất cả môn học
          </Link>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="rounded-2xl p-3 text-white shadow-lg shrink-0"
                style={{ backgroundColor: subject.color || "#2563eb" }}
              >
                <BookMarked className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-black text-slate-900">{subject.name}</h1>
                {subject.description ? (
                  <p className="mt-1 text-sm text-slate-500">{subject.description}</p>
                ) : (
                  <p className="mt-1 text-sm italic text-slate-300">Chưa có mô tả</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} />
                    {docs.length} tài liệu
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    Cập nhật {formatRelative(lastActivity)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <History size={12} />
                    {chats.length} tin nhắn chat
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy size={12} />
                    Trung bình quiz: {avgQuizScore ?? "—"}/10
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 shrink-0"
              title="Cài đặt môn"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Upload size={18} />
              {uploading ? "Đang xử lý AI..." : `Tải lên (1-${MAX_UPLOAD_FILES} file)`}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <button
              onClick={handleStartMultiChat}
              disabled={docs.length === 0}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-black text-slate-700 hover:border-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquareText size={18} />
              Chat với cả môn ({docs.length} tài liệu)
            </button>
            <button
              onClick={handleStartQuiz}
              disabled={docs.length === 0}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-black text-slate-700 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BrainCircuit size={18} />
              Tạo trắc nghiệm
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-sm border border-slate-100 w-fit">
          <TabBtn active={tab === "docs"} onClick={() => setTab("docs")} label="Tài liệu" count={docs.length} />
          <TabBtn active={tab === "chats"} onClick={() => setTab("chats")} label="Lịch sử chat" count={conversations.length + chats.length} />
          <TabBtn active={tab === "quizzes"} onClick={() => setTab("quizzes")} label="Quiz đã làm" count={quizzes.length} />
        </div>

        {tab === "docs" && (
          <>
          {docs.length > 10 && (
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Tìm tài liệu trong môn này..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((d) => (
              <div
                key={d.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(d.id, d.fileName)}
                    className="text-slate-300 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="line-clamp-1 text-sm font-bold text-slate-900" title={d.fileName}>
                  {d.fileName}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(d.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div>{(d.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button
                  onClick={() => navigate(`/study/${d.id}`)}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                >
                  Học ngay
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-5 cursor-pointer text-slate-400 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/30 transition-all min-h-[180px] ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-bold text-center">
                {uploading ? "Đang upload..." : "Thêm tài liệu vào môn này"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          {filteredDocs.length === 0 && docSearch.trim() && (
            <p className="mt-4 text-center text-sm text-slate-400">
              Không tìm thấy tài liệu khớp "{docSearch}".
            </p>
          )}
          </>
        )}

        {tab === "chats" && (
          <div className="space-y-3">
            {conversations.length === 0 && chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                <MessageSquareText className="h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">Chưa có chat nào trong môn này</h3>
                <p className="text-xs text-slate-500 mt-1">Bắt đầu hỏi AI về tài liệu trong môn.</p>
                {docs.length > 0 && (
                  <button
                    onClick={handleStartMultiChat}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
                  >
                    <MessageSquareText size={14} />
                    Chat đa tài liệu
                  </button>
                )}
              </div>
            ) : (
              <>
                {conversations.length > 0 && (
                  <>
                    <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Phiên chat đa tài liệu
                    </p>
                    {conversations.map((c) => (
                      <div
                        key={`conv-${c.id}`}
                        onClick={() => navigate(`/study-multi?conversationId=${c.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/study-multi?conversationId=${c.id}`);
                        }}
                        className="group w-full text-left flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="rounded-lg bg-purple-50 p-2 text-purple-600 shrink-0">
                            <MessageSquareText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.lastMessagePreview}</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {c.sourceDocumentIds.length} tài liệu • {c.messageCount} tin nhắn •{" "}
                              {formatRelative(new Date(c.updatedAt))}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(c.id, c.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-all shrink-0 ml-2"
                          title="Xóa phiên chat"
                          aria-label="Xóa phiên chat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {chats.length > 0 && (
                  <>
                    <p className="px-1 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Chat từng tài liệu
                    </p>
                    {chats.slice(0, 30).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/study/${c.docId}`)}
                        className="w-full text-left flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 shrink-0">
                            <MessageSquareText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{c.question}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                              📄 {c.docName} • {formatRelative(new Date(c.createdAt))}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                <button
                  onClick={handleStartMultiChat}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-slate-400 hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50/30 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-bold">Bắt đầu chat đa tài liệu mới</span>
                </button>
              </>
            )}
          </div>
        )}

        {tab === "quizzes" && (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                <Trophy className="h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">Chưa có quiz nào trong môn này</h3>
                <p className="text-xs text-slate-500 mt-1">Tạo quiz đầu tiên từ tài liệu của môn.</p>
                {docs.length > 0 && (
                  <button
                    onClick={handleStartQuiz}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    <BrainCircuit size={14} />
                    Tạo trắc nghiệm
                  </button>
                )}
              </div>
            ) : (
              <>
                {quizzes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => navigate(`/quizzes?retake=${q.id}`)}
                    className="w-full text-left flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`rounded-lg p-2 shrink-0 ${
                          q.score >= 8 ? "bg-emerald-50 text-emerald-600"
                          : q.score >= 6.5 ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                        }`}
                      >
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 line-clamp-1">{q.quizTitle}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {q.totalQuestions} câu • {formatRelative(new Date(q.completedAt))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-2xl font-black ${
                          q.score >= 8 ? "text-emerald-600"
                          : q.score >= 6.5 ? "text-amber-600"
                          : "text-red-600"
                        }`}
                      >
                        {q.score}
                      </span>
                      <span className="text-sm font-bold text-slate-400">/10</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleStartQuiz}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-slate-400 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-bold">Tạo quiz mới từ môn này</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editing && subject && (
        <SubjectEditModal
          subject={subject}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            fetchAll();
          }}
          onDeleted={() => {
            setEditing(false);
            navigate("/subjects", { replace: true });
          }}
        />
      )}
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

const TabBtn: React.FC<TabBtnProps> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
      active
        ? "bg-slate-900 text-white shadow"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    {label}{" "}
    <span className={`ml-1 ${active ? "text-white/70" : "text-slate-400"}`}>({count})</span>
  </button>
);

interface SubjectEditModalProps {
  subject: Subject;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const SubjectEditModal: React.FC<SubjectEditModalProps> = ({ subject, onCancel, onSaved, onDeleted }) => {
  const [name, setName] = useState(subject.name);
  const [description, setDescription] = useState(subject.description ?? "");
  const [color, setColor] = useState(subject.color ?? DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Tên môn không được rỗng");
      return;
    }
    const payload: SubjectInput = {
      name: trimmed,
      description: description?.trim() || undefined,
      color,
    };
    setSaving(true);
    try {
      await subjectApi.update(subject.id, payload);
      toast.success("Đã cập nhật môn học");
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không cập nhật được");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xóa môn "${subject.name}"? Tài liệu thuộc môn sẽ chuyển sang "Chưa phân loại".`)) return;
    try {
      await subjectApi.delete(subject.id);
      toast.success("Đã xóa môn học");
      onDeleted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không xóa được");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Pencil size={16} /> Cài đặt môn học
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Tên môn <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Mô tả</span>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <div className="mb-5">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Màu nhãn</span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === c ? "border-slate-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Xóa môn
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubjectDetail;
