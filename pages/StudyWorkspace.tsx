import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  BookOpen,
  History,
  Bot,
  ShieldAlert,
  User as UserIcon,
  RefreshCw,
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
  const [isReadOnly, setIsReadOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!docId) return;

    const loadData = async () => {
      try {
        const idNumber = Number(docId);
        const docRes = await documentApi.getById(idNumber);
        const docData = docRes.data.data;
        setDoc(docData);

        const readOnlyStatus = 
          currentUser.role === "ADMIN" && 
          docData.ownerCode !== currentUser.studentCode;
        
        setIsReadOnly(readOnlyStatus);

        if (!readOnlyStatus) {
          const historyRes = await aiApi.getChatHistory(idNumber);
          const mappedHistory: ChatMessage[] = historyRes.data.data.flatMap(
            (item: any) => [
              { id: `q-${item.id}`, role: "user", content: item.question, timestamp: item.createdAt },
              { id: `a-${item.id}`, role: "assistant", content: item.answer, timestamp: item.createdAt },
            ]
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !input.trim() || sending || !docId) return;

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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-blue-600 mr-2" />
      <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">Khởi tạo không gian học tập...</span>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 flex-col md:flex-row">
      
      {/* Nút quay lại - Cố định ở góc trên trái vùng tài liệu */}
      <div className="absolute left-6 top-20 z-20 hidden lg:block">
        <Link
          to={isReadOnly ? "/admin/all-documents" : "/documents"}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
        >
          <ArrowLeft size={14} />
          {isReadOnly ? "Hệ thống" : "Thư viện"}
        </Link>
      </div>

      {/* VÙNG 1: HIỂN THỊ TÀI LIỆU (CUỘN ĐỘC LẬP) */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 scrollbar-thin">
        <div className="mx-auto max-w-4xl px-6 py-10 lg:px-16 lg:py-16">
          <div className="rounded-3xl bg-white p-8 lg:p-14 shadow-sm border border-slate-200/60">
            <div className="mb-10 border-b border-slate-100 pb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                {doc?.fileName}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                 {isReadOnly ? (
                   <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase border border-amber-100">
                     <ShieldAlert size={12} /> Chế độ xem Admin
                   </span>
                 ) : (
                   <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase border border-blue-100">
                     <UserIcon size={12} /> Tài liệu của tôi
                   </span>
                 )}
                 <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Cập nhật: {doc?.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : ""}
                 </span>
              </div>
            </div>
            
            {/* Nội dung tài liệu với Typography tốt hơn */}
            <div className="prose prose-slate lg:prose-lg max-w-none text-slate-700 leading-relaxed font-medium">
              {doc?.content?.split("\n").map((para, i) => (
                para.trim() ? <p key={i} className="mb-4">{para}</p> : <br key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VÙNG 2: SIDEBAR CHAT AI (CỐ ĐỊNH CHIỀU CAO) */}
      <div className="flex w-full md:w-[380px] lg:w-[450px] flex-col bg-white border-l border-slate-200 shadow-2xl relative">
        
        {/* Overlay chặn tương tác nếu là tài liệu người khác */}
        {isReadOnly && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="bg-amber-100 p-4 rounded-3xl mb-4 text-amber-600 shadow-inner">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hạn chế tương tác</h3>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed font-bold">
              Bạn đang xem tài liệu hệ thống của sinh viên khác. Chức năng Chat AI và Làm Quiz đã bị vô hiệu hóa.
            </p>
          </div>
        )}

        {/* Header Sidebar */}
        <div className="flex h-16 items-center justify-between border-b px-6 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Bot size={20} />
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Gia sư EduAce</h2>
          </div>
          {!isReadOnly && <History size={18} className="text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />}
        </div>

        {/* Danh sách Chat */}
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6 bg-slate-50/30 scrollbar-none">
          {messages.length === 0 && !isReadOnly && (
            <div className="text-center py-10">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-blue-400" size={20} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bắt đầu hỏi AI về kiến thức trong bài</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm font-medium ${
                msg.role === "user" 
                ? "bg-blue-600 text-white" 
                : "bg-white text-slate-800 border border-slate-100"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-blue-700">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl px-4 py-2 shadow-sm text-xs font-bold text-blue-600 animate-pulse">
                <Sparkles size={14} className="animate-spin" />
                <span>AI đang phân tích...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        {!isReadOnly && (
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi bất cứ điều gì..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-5 pr-14 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 p-2.5 text-white shadow-lg hover:bg-blue-700 disabled:bg-slate-200 transition-all"
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