import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Sparkles,
  RefreshCw,
  BrainCircuit,
  GraduationCap,
  Play,
  RotateCcw,
  History,
  PlusCircle,
  Info,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { aiApi, documentApi, quizApi } from "../services/api";
import { Document, QuizResultResponse } from "../types";
import RoadmapView from "../components/RoadmapView";
import Loading from "../components/Loading";

const MAX_QUIZ_DOCS = 3;

const QuizEngine: React.FC = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialFromUrl = (searchParams.get("docIds") || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const initialIds = initialFromUrl.length > 0
    ? initialFromUrl.slice(0, MAX_QUIZ_DOCS)
    : docId ? [Number(docId)] : [];

  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>(initialIds);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [isGenerating, setIsGenerating] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const [result, setResult] = useState<(QuizResultResponse & { aiFeedbackText?: string }) | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [quizSourceIds, setQuizSourceIds] = useState<number[]>([]);
  const [targetedLoadingTopic, setTargetedLoadingTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await documentApi.getAll();
        setDocs(response.data.data || []);
      } catch (err) {
        toast.error("Không thể tải danh sách tài liệu");
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const retakeId = searchParams.get("retake");
    if (retakeId) {
      handleRetakeById(Number(retakeId));
    }
  }, [searchParams]);

  const resetQuizFlow = (): void => {
    setResult(null);
    setQuizReady(false);
    setQuizStarted(false);
    setQuizId(null);
    setQuestions([]);
    setCurrentStep(0);
    setUserAnswers({});
  };

  const toggleSelectDoc = (id: number) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_QUIZ_DOCS) {
        toast.error(`Trắc nghiệm tối đa ${MAX_QUIZ_DOCS} tài liệu`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRetakeById = async (id: number) => {
    setIsGenerating(true);
    try {
      const response = await quizApi.getQuizById(id);
      const quizData = response.data.data;

      const mappedQuestions = quizData.questions.map((q: any) => ({
        ...q,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
      }));

      resetQuizFlow();
      setQuestions(mappedQuestions);
      setQuizId(quizData.id);
      setQuizSourceIds((quizData as any).sourceDocumentIds ?? []);
      setQuizStarted(true);
      toast.success("Đã tải lại bộ đề ôn tập!");
    } catch (err) {
      toast.error("Không thể tải bộ đề");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (selectedDocIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 tài liệu");
      return;
    }
    if (selectedDocIds.length > MAX_QUIZ_DOCS) {
      toast.error(`Trắc nghiệm tối đa ${MAX_QUIZ_DOCS} tài liệu`);
      return;
    }
    setIsGenerating(true);
    try {
      const response = await quizApi.generate(selectedDocIds, numQuestions);
      const quizData = response.data.data;

      const mappedQuestions = quizData.questions.map((q: any) => ({
        ...q,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
      }));

      resetQuizFlow();
      setQuestions(mappedQuestions);
      setQuizId(quizData.id);
      setQuizSourceIds((quizData as any).sourceDocumentIds ?? selectedDocIds);
      setQuizReady(true);
      toast.success("AI đã soạn đề xong!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "AI đang bận, vui lòng thử lại sau ít phút");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitQuiz = async () => {
    if (!quizId) return;
    setIsGenerating(true);
    try {
      const indexToLetter = ["A", "B", "C", "D"];
      const formattedAnswers: Record<number, string> = {};

      questions.forEach((q, index) => {
        const selectedIdx = userAnswers[index];
        formattedAnswers[q.id] = indexToLetter[selectedIdx];
      });

      const response = await quizApi.submit(quizId, formattedAnswers);
      const data = response.data.data;
      setResult(data);
    } catch (err) {
      toast.error("Nộp bài thất bại");
    } finally {
      setIsGenerating(false);
    }
  };

  const getAIFeedback = async () => {
    if (!result?.id) return;
    setFeedbackLoading(true);
    try {
      const response = await aiApi.getQuizFeedback(result.id);
      setResult({ ...result, aiFeedbackText: response.data.data });
    } catch (err) {
      toast.error("Dịch vụ phân tích AI hiện không khả dụng");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleRetakeCurrent = () => {
    setResult(null);
    setCurrentStep(0);
    setUserAnswers({});
    setQuizReady(false);
    setQuizStarted(true);
    toast.success("Bắt đầu ôn luyện lại bộ đề vừa rồi!");
  };

  const handleStartFresh = (): void => {
    resetQuizFlow();
    navigate("/quizzes");
  };

  const handleTargetedPractice = async (topicHint: string): Promise<void> => {
    let sourceIds: number[] = selectedDocIds.length > 0 ? selectedDocIds : quizSourceIds;

    if (sourceIds.length === 0 && result?.quizId) {
      try {
        const quizDetail = await quizApi.getQuizById(result.quizId);
        const detailData = quizDetail.data.data as any;
        sourceIds = detailData?.sourceDocumentIds
          ?? (detailData?.documentId ? [detailData.documentId] : []);
      } catch {
        sourceIds = [];
      }
    }

    if (sourceIds.length === 0) {
      toast.error("Không xác định được tài liệu gốc. Vui lòng tạo đề mới thủ công.");
      handleStartFresh();
      return;
    }

    setTargetedLoadingTopic(topicHint);

    try {
      const response = await quizApi.generate(sourceIds, 5, topicHint);
      const quizData = response.data.data;

      const mappedQuestions = quizData.questions.map((q: any) => ({
        ...q,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
      }));

      setResult(null);
      setQuestions(mappedQuestions);
      setQuizId(quizData.id);
      setQuizSourceIds((quizData as any).sourceDocumentIds ?? sourceIds);
      setCurrentStep(0);
      setUserAnswers({});
      setSelectedDocIds(sourceIds);
      setQuizReady(false);
      setQuizStarted(true);
      toast.success(`Bắt đầu luyện tập: ${topicHint}`, { duration: 2500 });
    } catch (err) {
      toast.error("AI đang bận, vui lòng thử lại sau ít phút");
    } finally {
      setTargetedLoadingTopic(null);
    }
  };

  if (!quizReady && !quizStarted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-2xl border border-slate-100">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BrainCircuit size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Trình tạo trắc nghiệm</h1>
            <p className="text-slate-500 font-medium mt-2">
              Chọn tối đa {MAX_QUIZ_DOCS} tài liệu, AI sẽ tổng hợp ra đề ôn tập.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Tài liệu nguồn ({selectedDocIds.length}/{MAX_QUIZ_DOCS})
                </label>
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={() => setSelectedDocIds([])}
                    className="text-[10px] font-bold text-slate-400 uppercase hover:text-red-500"
                  >
                    Bỏ chọn hết
                  </button>
                )}
              </div>
              {docs.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  Bạn chưa có tài liệu nào. Hãy upload PDF ở trang Tài liệu trước.
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border-2 border-slate-50 bg-slate-50 p-3">
                  {docs.map((d) => {
                    const isSelected = selectedDocIds.includes(d.id);
                    const isDisabled = !isSelected && selectedDocIds.length >= MAX_QUIZ_DOCS;
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleSelectDoc(d.id)}
                        disabled={isDisabled}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-white text-blue-900 shadow-sm"
                            : isDisabled
                              ? "border-slate-100 bg-white opacity-40 cursor-not-allowed"
                              : "border-slate-100 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 min-w-[24px] items-center justify-center rounded-md border-2 text-xs font-black ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 truncate text-sm font-bold text-slate-700" title={d.fileName}>
                          {d.fileName}
                        </span>
                        {d.subjectName && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: d.subjectId ? "#3b82f6" : "#94a3b8" }}
                          >
                            {d.subjectName}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Số lượng câu hỏi</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumQuestions(num)}
                    className={`py-3 rounded-xl font-bold transition-all ${numQuestions === num ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || selectedDocIds.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-lg font-black text-white hover:bg-blue-600 transition-all shadow-xl disabled:bg-slate-200"
            >
              {isGenerating ? <RefreshCw className="h-6 w-6 animate-spin" /> : <><Sparkles size={20} /> SOẠN ĐỀ VỚI AI</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizReady && !quizStarted) {
    const previewNames = docs
      .filter((d) => selectedDocIds.includes(d.id))
      .map((d) => d.fileName);
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-10 shadow-2xl border-2 border-blue-600 animate-in zoom-in-95 duration-300">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">Đề thi đã sẵn sàng!</h2>
            <p className="text-slate-500 mt-2">AI đã hoàn thành việc trích xuất kiến thức</p>
          </div>

          <div className="space-y-4 bg-slate-50 p-6 rounded-3xl mb-8">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Tài liệu nguồn ({previewNames.length})</span>
              <div className="mt-2 space-y-1">
                {previewNames.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FileText size={14} className="text-slate-400" />
                    <span className="truncate">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Số câu hỏi</span>
              <span className="text-sm font-black text-blue-600">{questions.length} câu</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setQuizReady(false)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">ĐỂ SAU</button>
            <button onClick={() => setQuizStarted(true)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
              <Play size={18} fill="currentColor" /> BẮT ĐẦU LÀM
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const wrongAnswers = (result.answers || []).filter((a) => !a.isCorrect);

    return (
      <>
        {targetedLoadingTopic && (
          <Loading message={`AI đang sinh bài tập tập trung về: ${targetedLoadingTopic}...`} />
        )}
        <div className="mx-auto max-w-4xl p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-slate-100">
          <div className="bg-slate-900 px-8 py-14 text-center text-white">
            <Trophy className="mx-auto mb-5 h-16 w-16 text-yellow-400" />
            <h2 className="text-3xl font-black uppercase tracking-tight">Hoàn thành bài thi!</h2>
            <p className="text-6xl font-black text-blue-400 mt-5">{result.score}/10</p>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-3">
              {result.correctAnswers}/{result.totalQuestions} câu đúng ({Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)
            </p>
            {result.completedAt && (
              <p className="text-slate-500 font-semibold text-[11px] mt-2">
                Hoàn thành lúc {new Date(result.completedAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <RoadmapView
          roadmap={result.roadmap}
          servedBy={result.roadmapServedBy}
          onTargetedPractice={handleTargetedPractice}
          onStartFresh={handleStartFresh}
        />

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <GraduationCap className="text-blue-600" /> Nhận xét nhanh từ AI
            </h3>
            {!result.aiFeedbackText && (
              <button
                onClick={getAIFeedback}
                disabled={feedbackLoading}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {feedbackLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />} XEM NHẬN XÉT
              </button>
            )}
          </div>
          {result.aiFeedbackText ? (
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 prose prose-blue max-w-none shadow-inner animate-in zoom-in-95">
              <ReactMarkdown>{result.aiFeedbackText}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-semibold">
              Nhấn nút trên để AI phân tích chi tiết bài làm dưới dạng văn bản.
            </p>
          )}
        </div>

        {wrongAnswers.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-800 ml-2 flex items-center gap-3">
              <span className="h-9 w-9 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <Info size={18} />
              </span>
              Câu trả lời sai cần xem lại ({wrongAnswers.length})
            </h3>

            {wrongAnswers.map((answer, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2"
              >
                <div className="flex gap-4 mb-6">
                  <div className="h-11 w-11 min-w-[44px] flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-lg shadow-md">
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-relaxed mt-1">
                    {answer.questionContent}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  {(["A", "B", "C", "D"] as const).map((label) => {
                    const optionText = answer[`option${label}` as keyof typeof answer] as string;
                    const isSelected = answer.selectedOption === label;
                    const isCorrect = answer.correctAnswer === label;

                    let containerStyle = "bg-slate-50 border-slate-100 text-slate-600";
                    if (isCorrect) {
                      containerStyle = "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20";
                    } else if (isSelected && !answer.isCorrect) {
                      containerStyle = "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20";
                    }

                    return (
                      <div
                        key={label}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${containerStyle}`}
                      >
                        <span
                          className={`h-9 w-9 min-w-[36px] flex items-center justify-center rounded-xl font-black border-2 ${
                            isCorrect
                              ? "border-emerald-300 bg-white"
                              : isSelected
                              ? "border-red-300 bg-white"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {label}
                        </span>
                        <span className="font-bold text-[0.95rem]">{optionText}</span>
                      </div>
                    );
                  })}
                </div>

                {answer.explanation && (
                  <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex gap-4">
                    <div className="bg-white h-10 w-10 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Info size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                        Gia sư AI giải thích
                      </p>
                      <p className="text-slate-700 leading-relaxed font-semibold text-sm">
                        {answer.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <button
            onClick={handleRetakeCurrent}
            className="flex items-center justify-center gap-2 py-5 border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-sm tracking-widest hover:bg-blue-600 hover:text-white transition-all uppercase"
          >
            <RotateCcw size={18} /> Làm lại đề này
          </button>
          <button
            onClick={handleStartFresh}
            className="flex items-center justify-center gap-2 py-5 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-sm tracking-widest"
          >
            <PlusCircle size={18} /> Đề khác
          </button>
          <button
            onClick={() => navigate("/quiz-history")}
            className="flex items-center justify-center gap-2 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-blue-600 transition-all shadow-xl uppercase"
          >
            <History size={18} /> Lịch sử
          </button>
        </div>
        </div>
      </>
    );
  }

  const q = questions[currentStep];
  return (
    <>
      {targetedLoadingTopic && (
        <Loading message={`AI đang sinh bài tập tập trung về: ${targetedLoadingTopic}...`} />
      )}
    <div className="mx-auto max-w-3xl p-8 animate-in fade-in">
      <div className="mb-10 flex items-center justify-between">
        <button onClick={() => setQuizStarted(false)} className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 hover:text-red-500 transition-colors"><ArrowLeft size={16} /> Thoát</button>
        <div className="flex items-center gap-6">
          <div className="h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
          </div>
          <span className="text-sm font-black text-slate-900">{currentStep + 1} / {questions.length}</span>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 mb-8">
        <h2 className="text-xl font-bold text-slate-800 leading-relaxed">{q?.content}</h2>
      </div>

      <div className="grid gap-3 mb-10">
        {q?.options?.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => setUserAnswers({ ...userAnswers, [currentStep]: index })}
            className={`flex w-full items-center gap-4 rounded-[1.5rem] border-2 p-6 text-left transition-all ${userAnswers[currentStep] === index ? "border-blue-600 bg-blue-50 text-blue-900 shadow-md scale-[1.02]" : "border-slate-50 bg-white text-slate-500 hover:border-slate-200"}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 text-[10px] font-black ${userAnswers[currentStep] === index ? "bg-blue-600 border-blue-600 text-white" : "border-slate-100 text-slate-300"}`}>{["A", "B", "C", "D"][index]}</span>
            <span className="font-bold">{option}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => currentStep < questions.length - 1 ? setCurrentStep(currentStep + 1) : submitQuiz()}
        disabled={userAnswers[currentStep] === undefined || isGenerating}
        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-200"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="animate-spin" />
            {currentStep === questions.length - 1 ? "AI ĐANG XÂY LỘ TRÌNH HỌC TẬP..." : "ĐANG XỬ LÝ..."}
          </>
        ) : (
          <>
            {currentStep === questions.length - 1 ? "HOÀN TẤT & NỘP BÀI" : "CÂU TIẾP THEO"}
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </div>
    </>
  );
};

export default QuizEngine;
