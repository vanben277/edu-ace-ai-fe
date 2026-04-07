import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  PlusCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { quizApi, documentApi, aiApi } from "../services/api";
import { Document } from "../types";
import toast from "react-hot-toast";

const QuizEngine: React.FC = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>(docId || "");
  const [numQuestions, setNumQuestions] = useState<number>(5);

  // Trạng thái luồng
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizReady, setQuizReady] = useState(false); 
  const [quizStarted, setQuizStarted] = useState(false); 

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const [result, setResult] = useState<any | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [quizId, setQuizId] = useState<number | null>(null);

  // 1. Khởi tạo danh sách tài liệu
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

  // 2. Xử lý khi được gọi "Làm lại" từ trang Lịch sử thông qua URL
  useEffect(() => {
    const retakeId = searchParams.get("retake");
    if (retakeId) {
      handleRetakeById(Number(retakeId));
    }
  }, [searchParams]);

  const handleRetakeById = async (id: number) => {
    setIsGenerating(true);
    try {
      const response = await quizApi.getQuizById(id);
      const quizData = response.data.data;

      const mappedQuestions = quizData.questions.map((q: any) => ({
        ...q,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
      }));

      setQuestions(mappedQuestions);
      setQuizId(quizData.id);
      setQuizStarted(true); 
      toast.success("Đã tải lại bộ đề ôn tập!");
    } catch (err) {
      toast.error("Không thể tải bộ đề");
    } finally {
      setIsGenerating(false);
    }
  };

  // HÀM RA ĐỀ: Soạn đề mới từ đầu
  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return toast.error("Vui lòng chọn tài liệu");
    setIsGenerating(true);
    try {
      const response = await quizApi.generate(Number(selectedDoc), numQuestions);
      const quizData = response.data.data;

      const mappedQuestions = quizData.questions.map((q: any) => ({
        ...q,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
      }));

      setQuestions(mappedQuestions);
      setQuizId(quizData.id);
      setQuizReady(true); 
      toast.success("AI đã soạn đề xong!");
    } catch (err) {
      toast.error("AI đang bận, vui lòng thử lại sau ít phút");
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
      setResult(response.data.data);
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

  // LOGIC: Làm lại chính bộ đề vừa làm xong
  const handleRetakeCurrent = () => {
    setResult(null);
    setCurrentStep(0);
    setUserAnswers({});
    setQuizStarted(true);
    toast.success("Bắt đầu ôn luyện lại bộ đề vừa rồi!");
  };

  // --- 1. MÀN HÌNH THIẾT LẬP (SETUP) ---
  if (!quizReady && !quizStarted) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-10 shadow-2xl border border-slate-100">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BrainCircuit size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Trình tạo trắc nghiệm</h1>
            <p className="text-slate-500 font-medium mt-2">Cấu hình bộ đề thi cá nhân hóa từ AI</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tài liệu học tập</label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="">-- Chọn tài liệu --</option>
                {docs.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.fileName}</option>
                ))}
              </select>
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
              disabled={isGenerating || !selectedDoc}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-lg font-black text-white hover:bg-blue-600 transition-all shadow-xl disabled:bg-slate-200"
            >
              {isGenerating ? <RefreshCw className="h-6 w-6 animate-spin" /> : <><Sparkles size={20} /> SOẠN ĐỀ VỚI AI</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. MÀN HÌNH PREVIEW ---
  if (quizReady && !quizStarted) {
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Tài liệu</span>
              <span className="text-sm font-black text-slate-700 max-w-[200px] truncate">{docs.find((d) => String(d.id) === selectedDoc)?.fileName}</span>
            </div>
            <div className="flex items-center justify-between">
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

  // --- 3. MÀN HÌNH KẾT QUẢ ---
  if (result) {
    return (
      <div className="mx-auto max-w-4xl p-8 animate-in fade-in duration-500">
        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-slate-100">
          <div className="bg-slate-900 px-8 py-16 text-center text-white">
            <Trophy className="mx-auto mb-6 h-16 w-16 text-yellow-400" />
            <h2 className="text-3xl font-black uppercase tracking-tight">Hoàn thành bài thi!</h2>
            <p className="text-6xl font-black text-blue-400 mt-6">{result.score}/10</p>
          </div>
          <div className="p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2"><GraduationCap className="text-blue-600" /> Phân tích từ AI</h3>
              {!result.aiFeedbackText && (
                <button onClick={getAIFeedback} disabled={feedbackLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all">
                  {feedbackLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />} PHÂN TÍCH BÀI LÀM
                </button>
              )}
            </div>
            
            {result.aiFeedbackText && (
              <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100 prose prose-blue max-w-none shadow-inner animate-in zoom-in-95">
                <ReactMarkdown>{result.aiFeedbackText}</ReactMarkdown>
                
                {/* NÚT LÀM LẠI ĐỀ VỪA LÀM (Chỉ hiện khi có Feedback) */}
                <div className="mt-8 border-t border-blue-100 pt-6 flex justify-center">
                    <button 
                        onClick={handleRetakeCurrent}
                        className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                        <RotateCcw size={18} /> LÀM LẠI ĐỀ NÀY
                    </button>
                </div>
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => { setQuizReady(false); setQuizStarted(false); setResult(null); navigate("/quizzes"); }} 
                className="flex items-center justify-center gap-2 py-5 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-sm tracking-widest"
              >
                <PlusCircle size={18} /> Làm đề khác
              </button>
              
              <button 
                onClick={() => navigate("/quiz-history")}
                className="flex items-center justify-center gap-2 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-blue-600 transition-all shadow-xl uppercase"
              >
                <History size={18} /> Lịch sử ôn tập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. MÀN HÌNH ĐANG LÀM BÀI ---
  const q = questions[currentStep];
  return (
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
        {isGenerating ? <RefreshCw className="animate-spin" /> : currentStep === questions.length - 1 ? "HOÀN TẤT & NỘP BÀI" : "CÂU TIẾP THEO"}
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default QuizEngine;