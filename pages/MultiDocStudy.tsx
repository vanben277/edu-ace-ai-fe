import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Bot,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { aiApi, documentApi } from "../services/api";
import { Document, ChatMessage } from "../types";

const MultiDocStudy: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdsParam = searchParams.get("docIds") || "";
  const initialIds = docIdsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const [docs, setDocs] = useState<Document[]>([]);
  const [activeIds, setActiveIds] = useState<number[]>(initialIds);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialIds.length === 0) {
      setLoading(false);
      return;
    }
    const loadAll = async () => {
      try {
        const results = await Promise.all(
          initialIds.map((id) => documentApi.getById(id).then((r) => r.data.data))
        );
        setDocs(results);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không tải được tài liệu");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [docIdsParam]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  const toggleActive = (id: number) => {
    setActiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    if (activeIds.length === 0) {
      toast.error("Cần chọn ít nhất 1 tài liệu nguồn");
      return;
    }

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
      const res = await aiApi.chatOnDocuments(activeIds, currentInput);
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: res.data.data,
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <RefreshCw className="animate-spin text-blue-600 mr-2" />
        <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
          Đang tải tài liệu nguồn...
        </span>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <MessageSquare className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Không có tài liệu nguồn</h2>
        <p className="mt-2 text-sm text-slate-500">
          Bạn cần chọn ít nhất 1 tài liệu để bắt đầu phiên chat đa nguồn.
        </p>
        <Link
          to="/documents"
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Quay lại danh sách tài liệu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Phiên chat đa tài liệu</h1>
            <p className="text-xs text-slate-500">
              {activeIds.length}/{docs.length} tài liệu được chọn làm nguồn
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <Bot size={14} /> Gia sư EduAce
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {docs.map((d) => {
            const isActive = activeIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleActive(d.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
                title={isActive ? "Click để bỏ khỏi nguồn" : "Click để thêm vào nguồn"}
              >
                <FileText size={12} />
                <span className="max-w-[180px] truncate">{d.fileName}</span>
                {isActive && <X size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">Bắt đầu chat đa tài liệu</h3>
              <p className="mt-2 text-xs text-slate-500">
                Đặt câu hỏi so sánh, đối chiếu, tổng hợp giữa các tài liệu đã chọn. AI sẽ trích dẫn nguồn rõ ràng.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">"So sánh ... giữa 2 tài liệu"</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">"Tổng hợp ý chính về ..."</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">"Tài liệu nào nói về ..."</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-800 border border-slate-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-blue-700">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm">
                <Sparkles size={14} className="animate-spin" /> AI đang tổng hợp...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSend} className="mx-auto max-w-3xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi câu so sánh / tổng hợp về các tài liệu đã chọn..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-5 pr-14 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || activeIds.length === 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 p-2.5 text-white shadow-lg hover:bg-blue-700 disabled:bg-slate-200"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MultiDocStudy;
