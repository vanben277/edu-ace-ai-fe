import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Sparkles,
  BookOpen,
  History,
  Bot,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { documentApi, aiApi } from "../services/api";
import { Document, ChatMessage } from "../types";
import toast from "react-hot-toast";

const StudyWorkspace: React.FC = () => {
  const { docId } = useParams();
  const [doc, setDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // Trạng thái chỉ xem
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lấy thông tin user hiện tại
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!docId) return;

    const loadData = async () => {
      try {
        const idNumber = Number(docId);
        // 1. Lấy thông tin tài liệu trước
        const docRes = await documentApi.getById(idNumber);
        const docData = docRes.data.data;
        setDoc(docData);

        // 2. LOGIC QUYẾT ĐỊNH QUYỀN HẠN:
        // Nếu người dùng là ADMIN và tài liệu KHÔNG PHẢI của mình -> Chế độ chỉ xem
        const readOnlyStatus =
          currentUser.role === "ADMIN" &&
          docData.ownerCode !== currentUser.studentCode;

        setIsReadOnly(readOnlyStatus);

        // 3. Nếu không phải chế độ chỉ xem, lấy lịch sử chat
        if (!readOnlyStatus) {
          const historyRes = await aiApi.getChatHistory(idNumber);
          const mappedHistory: ChatMessage[] = historyRes.data.data.flatMap(
            (item: any) => [
              {
                id: `q-${item.id}`,
                role: "user",
                content: item.question,
                timestamp: item.createdAt,
              },
              {
                id: `a-${item.id}`,
                role: "assistant",
                content: item.answer,
                timestamp: item.createdAt,
              },
            ],
          );
          setMessages(mappedHistory);
        }
      } catch (err) {
        toast.error("Tài liệu không tồn tại hoặc không có quyền truy cập");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [docId, currentUser.studentCode, currentUser.role]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return; // Chặn gửi tin nếu đang ở mode xem file người khác
    if (!input.trim() || sending || !docId) return;

    const currentInput = input;
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: currentInput,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await aiApi.chatOnDocument(Number(docId), currentInput);
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.data.data,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "AI không phản hồi");
      setInput(currentInput);
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải...
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* Nút Back */}
      <div className="fixed left-4 top-20 z-20">
        <Link
          to={isReadOnly ? "/admin/all-documents" : "/documents"}
          className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-md hover:bg-blue-600 hover:text-white transition-all"
        >
          <ArrowLeft size={16} />
          {isReadOnly ? "Quay lại kho tài liệu" : "Thư viện của tôi"}
        </Link>
      </div>

      {/* Vùng hiển thị tài liệu */}
      <div className="flex-1 overflow-y-auto px-8 py-12 lg:px-20">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-12 shadow-xl ring-1 ring-slate-200">
          <div className="mb-10 border-b border-slate-100 pb-8">
            <h1 className="text-4xl font-extrabold text-slate-900">
              {doc?.fileName}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {isReadOnly ? (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldAlert size={12} /> Chế độ xem (Hệ thống)
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <UserIcon size={12} /> Tài liệu cá nhân
                </span>
              )}
              <span className="flex items-center gap-1">
                <BookOpen size={14} /> Nội dung gốc
              </span>
            </div>
          </div>
          <div className="prose prose-blue max-w-none text-lg text-slate-700">
            {doc?.content?.split("\n").map((para, i) => (
              <p key={i} className="mb-4">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Chat AI */}
      <div className="flex w-[450px] flex-col bg-white border-l border-slate-200 shadow-2xl relative">
        {/* Overlay nếu đang ở chế độ xem tài liệu người khác */}
        {isReadOnly && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-amber-50 p-4 rounded-full mb-4">
              <ShieldAlert className="text-amber-600 w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Chế độ xem quản trị
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Bạn đang xem tài liệu của sinh viên <b>{doc?.ownerCode}</b>. Bạn
              chỉ có quyền đọc nội dung, không thể tương tác AI.
            </p>
          </div>
        )}

        {/* Header Chat */}
        <div className="flex items-center justify-between border-b px-6 py-4 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <h2 className="text-sm font-bold">Gia sư AI EduAce</h2>
          </div>
        </div>

        {/* Danh sách tin nhắn */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-6 overflow-y-auto p-6 scrollbar-thin"
        >
          {!isReadOnly &&
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-blue-600 animate-pulse">
                <Sparkles size={16} className="animate-spin" />
                <span>EduAce đang phản hồi...</span>
              </div>
            </div>
          )}
        </div>

        {/* Ô nhập liệu */}
        {!isReadOnly && (
          <div className="border-t p-6 bg-white">
            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi bất cứ điều gì về tài liệu này..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-5 pr-14 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 p-2.5 text-white shadow-lg hover:bg-blue-700 disabled:bg-slate-200"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyWorkspace;
