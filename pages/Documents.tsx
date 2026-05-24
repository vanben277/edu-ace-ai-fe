import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  Upload,
  Clock,
  ExternalLink,
  Trash2,
  Filter,
  BookMarked,
  MessageSquareText,
  CheckSquare,
  Square,
  X,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { documentApi, subjectApi } from "../services/api";
import { Document, Subject } from "../types";

const UNASSIGNED = "unassigned";
const MAX_UPLOAD_FILES = 4;
const MAX_CHAT_DOCS = 4;

const Documents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubjectFilter = searchParams.get("subjectId");

  const [docs, setDocs] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>(
    initialSubjectFilter ?? "all"
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingSubjectId, setPendingSubjectId] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const fetchSubjects = async () => {
    try {
      const res = await subjectApi.list();
      setSubjects(res.data.data);
    } catch (err) {
    }
  };

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params: { subjectId?: number; unassignedOnly?: boolean } = {};
      if (subjectFilter === UNASSIGNED) {
        params.unassignedOnly = true;
      } else if (subjectFilter !== "all") {
        const idNum = Number(subjectFilter);
        if (!Number.isNaN(idNum)) params.subjectId = idNum;
      }
      const response = await documentApi.getAll(params);
      setDocs(response.data.data);
    } catch (err) {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchDocs();
    if (subjectFilter === "all") {
      searchParams.delete("subjectId");
    } else {
      searchParams.set("subjectId", subjectFilter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [subjectFilter]);

  const handleDeleteDoc = async (id: number, fileName: string) => {
    const isConfirm = window.confirm(
      `Bạn có chắc chắn muốn xoá tài liệu "${fileName}" không? Hành động này sẽ xoá tất cả dữ liệu chat liên quan.`
    );
    if (!isConfirm) return;

    try {
      await documentApi.delete(id);
      toast.success("Đã xoá tài liệu thành công!");
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xoá tài liệu");
    }
  };

  const stageFilesForUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (files.length > MAX_UPLOAD_FILES) {
      toast.error(`Mỗi lần chỉ upload tối đa ${MAX_UPLOAD_FILES} file. Bạn chọn ${files.length}.`);
      return;
    }
    const nonPdf = files.find((f) => f.type !== "application/pdf");
    if (nonPdf) {
      toast.error(`File "${nonPdf.name}" không phải PDF.`);
      return;
    }

    setPendingFiles(files);
    setPendingSubjectId("");
    setUploadModalOpen(true);
  };

  const submitUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      let uploaded: Document[] = [];
      if (pendingFiles.length === 1) {
        const fd = new FormData();
        fd.append("file", pendingFiles[0]);
        if (pendingSubjectId) fd.append("subjectId", pendingSubjectId);
        const res = await documentApi.upload(fd);
        uploaded = [res.data.data];
      } else {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append("files", f));
        if (pendingSubjectId) fd.append("subjectId", pendingSubjectId);
        const res = await documentApi.uploadBatch(fd);
        uploaded = res.data.data;
      }

      toast.success(`Đã tải lên ${uploaded.length} tài liệu`);
      setUploadModalOpen(false);
      setPendingFiles([]);

      if (pendingSubjectId) {
        navigate(`/subjects/${pendingSubjectId}`);
        return;
      }

      await fetchDocs();
      await fetchSubjects();

      if (uploaded.length >= 2) {
        const ids = uploaded.map((d) => d.id).join(",");
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Chat với {uploaded.length} tài liệu vừa upload?</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate(`/study-multi?docIds=${ids}`);
                }}
                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
              >
                Mở chat
              </button>
            </div>
          ),
          { duration: 8000 }
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tải tài liệu lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleAssignSubject = async (docId: number, newValue: string) => {
    const subjectId = newValue === "" ? null : Number(newValue);
    try {
      await documentApi.setSubject(docId, subjectId);
      toast.success(subjectId === null ? "Đã bỏ phân loại tài liệu" : "Đã gán môn học");
      fetchDocs();
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không cập nhật được môn học");
    }
  };

  const toggleSelected = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= MAX_CHAT_DOCS) {
        toast.error(`Chỉ chọn được tối đa ${MAX_CHAT_DOCS} tài liệu để chat.`);
        return;
      }
      next.add(id);
    }
    setSelectedIds(next);
  };

  const startMultiChat = () => {
    if (selectedIds.size < 1) {
      toast.error("Chọn ít nhất 1 tài liệu");
      return;
    }
    const ids = Array.from(selectedIds).join(",");
    navigate(`/study-multi?docIds=${ids}`);
  };

  const startMultiQuiz = () => {
    if (selectedIds.size < 1) {
      toast.error("Chọn ít nhất 1 tài liệu");
      return;
    }
    if (selectedIds.size > 3) {
      toast.error("Trắc nghiệm chọn tối đa 3 tài liệu");
      return;
    }
    const ids = Array.from(selectedIds).join(",");
    navigate(`/quizzes?docIds=${ids}`);
  };

  const subjectMap = useMemo(() => {
    const m = new Map<number, Subject>();
    subjects.forEach((s) => m.set(s.id, s));
    return m;
  }, [subjects]);

  const filteredDocs = docs.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài liệu của tôi</h1>
          <p className="text-slate-500">
            Quản lý tài liệu học tập và các tệp PDF của bạn. Upload tối đa {MAX_UPLOAD_FILES} file mỗi lần.
          </p>
        </div>
        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Đang xử lý AI..." : `Tải lên (1-${MAX_UPLOAD_FILES} file)`}
          <input
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            multiple
            onChange={stageFilesForUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu của bạn..."
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full sm:w-60 rounded-lg border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả môn học</option>
            <option value={UNASSIGNED}>Chưa phân loại</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setSelectionMode((m) => !m);
            setSelectedIds(new Set());
          }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
            selectionMode
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          {selectionMode ? "Hủy chọn" : "Chọn nhiều"}
        </button>
      </div>

      {selectionMode && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-semibold text-blue-900">
            Đã chọn {selectedIds.size} / {MAX_CHAT_DOCS} tài liệu
          </span>
          <div className="flex gap-2">
            <button
              onClick={startMultiChat}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              Chat với {selectedIds.size} tài liệu
            </button>
            <button
              onClick={startMultiQuiz}
              disabled={selectedIds.size > 3}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              title={selectedIds.size > 3 ? "Trắc nghiệm tối đa 3 tài liệu" : ""}
            >
              Tạo quiz ({selectedIds.size}/3)
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {searchTerm || subjectFilter !== "all"
              ? "Không tìm thấy tài liệu phù hợp"
              : "Chưa có tài liệu nào"}
          </h3>
          <p className="mt-1 text-slate-500">
            {searchTerm || subjectFilter !== "all"
              ? "Thử bỏ bộ lọc hoặc tìm từ khóa khác."
              : "Hãy tải lên tệp PDF đầu tiên để bắt đầu học cùng AI."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocs.map((doc) => {
            const subject = doc.subjectId != null ? subjectMap.get(doc.subjectId) : null;
            const badgeColor = subject?.color || "#94a3b8";
            const isSelected = selectedIds.has(doc.id);
            return (
              <div
                key={doc.id}
                className={`group relative flex flex-col rounded-xl border bg-white p-5 transition-all ${
                  isSelected ? "border-blue-600 shadow-md ring-2 ring-blue-200" : "border-slate-200 hover:shadow-md"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  {selectionMode ? (
                    <button
                      onClick={() => toggleSelected(doc.id)}
                      className={`rounded-lg p-2 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                    </button>
                  ) : (
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                  {!selectionMode && (
                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                      className="text-slate-300 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Xoá tài liệu"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <h3
                  className="line-clamp-1 font-semibold text-slate-900"
                  title={doc.fileName}
                >
                  {doc.fileName}
                </h3>

                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <BookMarked className="h-3.5 w-3.5" style={{ color: badgeColor }} />
                    <span
                      className="font-medium"
                      style={{ color: subject ? badgeColor : "#94a3b8" }}
                    >
                      {subject ? subject.name : "Chưa phân loại"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Dung lượng: {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {!selectionMode && (
                  <select
                    value={doc.subjectId ?? ""}
                    onChange={(e) => handleAssignSubject(doc.id, e.target.value)}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    title="Đổi môn học"
                  >
                    <option value="">Chưa phân loại</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                {!selectionMode && (
                  <button
                    onClick={() => navigate(`/study/${doc.id}`)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
                  >
                    Học ngay
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Tải lên {pendingFiles.length} tài liệu
              </h2>
              <button
                onClick={() => {
                  if (!uploading) {
                    setUploadModalOpen(false);
                    setPendingFiles([]);
                  }
                }}
                disabled={uploading}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="flex-1 truncate font-medium text-slate-700" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Tải vào môn học nào? <span className="text-red-500">*</span>
              </span>
              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                <SubjectRadio
                  checked={pendingSubjectId === ""}
                  onChange={() => setPendingSubjectId("")}
                  color="#94a3b8"
                  label="Chưa phân loại"
                  sublabel="Có thể gán môn sau qua từng card"
                />
                {subjects.map((s) => (
                  <SubjectRadio
                    key={s.id}
                    checked={pendingSubjectId === String(s.id)}
                    onChange={() => setPendingSubjectId(String(s.id))}
                    color={s.color || "#2563eb"}
                    label={s.name}
                    sublabel={`${s.documentCount} tài liệu`}
                  />
                ))}
              </div>
              {subjects.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Bạn chưa có môn học nào. Có thể{" "}
                  <Link to="/subjects" className="text-blue-600 font-semibold hover:underline">
                    tạo môn học mới
                  </Link>{" "}
                  rồi quay lại upload.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setPendingFiles([]);
                }}
                disabled={uploading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={submitUpload}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Đang xử lý AI..." : `Tải lên ${pendingFiles.length} file`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SubjectRadioProps {
  checked: boolean;
  onChange: () => void;
  color: string;
  label: string;
  sublabel: string;
}

const SubjectRadio: React.FC<SubjectRadioProps> = ({ checked, onChange, color, label, sublabel }) => (
  <button
    type="button"
    onClick={onChange}
    className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-all ${
      checked
        ? "border-blue-600 bg-white shadow-sm"
        : "border-transparent bg-white hover:border-slate-200"
    }`}
  >
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0"
      style={{ borderColor: checked ? "#2563eb" : "#cbd5e1" }}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
    </span>
    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold text-slate-800 truncate">{label}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{sublabel}</div>
    </div>
  </button>
);

export default Documents;
