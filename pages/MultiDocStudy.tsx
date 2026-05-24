import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Bot,
  RefreshCw,
  FileText,
  Check,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { conversationApi, documentApi } from "../services/api";
import { ChatMessage } from "../types";

const MAX_ACTIVE_SOURCES = 4;

interface SourceChip {
  id: number;
  fileName: string;
}

const MultiDocStudy: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdsParam = searchParams.get("docIds") || "";
  const conversationIdParam = searchParams.get("conversationId");
  const subjectIdParam = searchParams.get("subjectId");

  const initialIds = docIdsParam
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const [sources, setSources] = useState<SourceChip[]>([]);
  const [activeIds, setActiveIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(
    conversationIdParam ? Number(conversationIdParam) : null
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chipSearch, setChipSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleSources = useMemo(() => {
    const term = chipSearch.trim().toLowerCase();
    if (!term) return sources;
    return sources.filter((d) => d.fileName.toLowerCase().includes(term));
  }, [sources, chipSearch]);

  const sourcesLocked = conversationId != null;

  useEffect(() => {
    const load = async () => {
      try {
        if (conversationIdParam) {
          const res = await conversationApi.getDetail(Number(conversationIdParam));
          const detail = res.data.data;
          const chips: SourceChip[] = detail.sourceDocumentIds.map((id, i) => ({
            id,
            fileName: detail.sourceDocumentNames[i] ?? `Tài liệu #${id}`,
          }));
          setSources(chips);
          setActiveIds(detail.sourceDocumentIds);
          setMessages(
            detail.messages.map((m) => ({
              id: m.id,
              role: m.role === "USER" ? "user" : "assistant",
              content: m.content,
              timestamp: m.createdAt,
            }))
          );
        } else if (initialIds.length > 0) {
          const results = await Promise.allSettled(
            initialIds.map((id) => documentApi.getById(id).then((r) => r.data.data))
          );
          const ok: SourceChip[] = [];
          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value) {
              ok.push({ id: r.value.id, fileName: r.value.fileName });
            }
          });
          setSources(ok);
          setActiveIds(ok.slice(0, MAX_ACTIVE_SOURCES).map((d) => d.id));
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không tải được phiên chat");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [docIdsParam, conversationIdParam]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  const toggleActive = (id: number) => {
    if (sourcesLocked) return;
    setActiveIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ACTIVE_SOURCES) {
        toast.error(`Tối đa ${MAX_ACTIVE_SOURCES} tài liệu mỗi cuộc chat. Bỏ bớt 1 file để chọn file khác.`);
        return prev;
      }
      return [...prev, id];
    });
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
      if (conversationId == null) {
        const res = await conversationApi.start({
          documentIds: activeIds,
          message: currentInput,
          subjectId: subjectIdParam ? Number(subjectIdParam) : undefined,
        });
        const detail = res.data.data;
        setConversationId(detail.id);
        const aiMessage = [...detail.messages].reverse().find((m) => m.role === "ASSISTANT");
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessage?.id ?? Date.now() + 1,
            role: "assistant",
            content: aiMessage?.content ?? "(không có phản hồi)",
            timestamp: aiMessage?.createdAt ?? new Date().toISOString(),
          },
        ]);
      } else {
        const res = await conversationApi.ask(conversationId, currentInput);
        const m = res.data.data;
        setMessages((prev) => [
          ...prev,
          { id: m.id, role: "assistant", content: m.content, timestamp: m.createdAt },
        ]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "AI không phản hồi");
      setInput(currentInput);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMsg.id));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <RefreshCw className="animate-spin text-blue-600 mr-2" />
        <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
          Đang tải phiên chat...
        </span>
      </div>
    );
  }

  if (sources.length === 0) {
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
            to={subjectIdParam ? `/subjects/${subjectIdParam}` : "/documents"}
            className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Phiên chat đa tài liệu</h1>
            <p className="text-xs text-slate-500">
              {sourcesLocked
                ? `${activeIds.length} tài liệu nguồn (đã lưu)`
                : `Đã chọn ${activeIds.length}/${MAX_ACTIVE_SOURCES} nguồn` +
                  (sources.length > activeIds.length ? ` • ${sources.length} tài liệu trong môn` : "")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={chipSearch}
              onChange={(e) => setChipSearch(e.target.value)}
              placeholder="Tìm tài liệu..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <Bot size={14} /> Gia sư EduAce
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {visibleSources.map((d) => {
            const isActive = activeIds.includes(d.id);
            const isDisabled = !sourcesLocked && !isActive && activeIds.length >= MAX_ACTIVE_SOURCES;
            return (
              <button
                key={d.id}
                onClick={() => toggleActive(d.id)}
                disabled={isDisabled || sourcesLocked}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isDisabled
                      ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                } ${sourcesLocked ? "cursor-default" : ""}`}
                title={
                  sourcesLocked
                    ? "Nguồn của phiên này đã cố định"
                    : isActive
                      ? "Đang là nguồn — click để bỏ"
                      : isDisabled
                        ? `Đã đủ ${MAX_ACTIVE_SOURCES} nguồn, bỏ bớt 1 file để thêm`
                        : "Click để thêm vào nguồn chat"
                }
              >
                {isActive ? <Check size={12} /> : <FileText size={12} />}
                <span className="max-w-[180px] truncate">{d.fileName}</span>
              </button>
            );
          })}
          {visibleSources.length === 0 && (
            <span className="text-xs italic text-slate-400">Không tìm thấy tài liệu khớp.</span>
          )}
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
                Phiên chat sẽ được lưu để xem lại.
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
                className={`max-w-[85%] min-w-0 overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-800 border border-slate-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-blue max-w-none break-words prose-p:leading-relaxed prose-strong:text-blue-700 prose-pre:overflow-x-auto prose-pre:max-w-full prose-pre:whitespace-pre prose-code:break-words">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
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
