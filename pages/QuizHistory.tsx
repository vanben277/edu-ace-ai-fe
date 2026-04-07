import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Info,
  Clock,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { quizApi, aiApi } from "../services/api";
import toast from "react-hot-toast";

const QuizHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await quizApi.getHistory();
      const data = response.data.data || [];

      // SẮP XẾP TẠI ĐÂY: Mới nhất lên đầu
      const sortedData = [...data].sort((a, b) => {
        return (
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
      });

      setHistory(sortedData);
    } catch (err) {
      toast.error("Không thể tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (resultId: number) => {
    setReviewLoading(true);
    setAiFeedback(null);
    try {
      const response = await quizApi.getResult(resultId);
      // KHỚP VỚI POSTMAN: lấy response.data.data
      if (response.data && response.data.data) {
        setSelectedResult(response.data.data);
      }
    } catch (err: any) {
      toast.error("Lỗi khi tải chi tiết bài thi");
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchAiFeedback = async () => {
    if (!selectedResult) return;
    setFeedbackLoading(true);
    try {
      const response = await aiApi.getQuizFeedback(selectedResult.id);
      setAiFeedback(response.data.data);
    } catch (err) {
      toast.error("AI đang bận, thử lại sau");
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in">
      {!selectedResult ? (
        <>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-10">
            <Clock className="text-blue-600" size={32} /> Lịch sử ôn luyện
          </h1>
          {loading ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleViewDetails(item.id)}
                  className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg ${item.score >= 5 ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}
                    >
                      {item.score}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 line-clamp-1">
                        {item.quizTitle}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase">
                        {item.correctAnswers}/{item.totalQuestions} câu đúng •{" "}
                        {new Date(item.completedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-600" />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedResult(null)}
              className="flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>
            {/* <div className="flex gap-3">
                            <button onClick={fetchAiFeedback} disabled={feedbackLoading} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                                {feedbackLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />} Nhận xét AI
                            </button>
                            
                            <button
                                onClick={() => {
                                    if (selectedResult.quizId) navigate(`/quizzes?retake=${selectedResult.quizId}`);
                                    else toast.error("Cần cập nhật Backend để lấy Quiz ID làm lại bài!");
                                }}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                            >
                                <RotateCcw size={18} /> Làm lại
                            </button>
                        </div> */}
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white mb-10 shadow-2xl">
            <Trophy className="mx-auto text-yellow-400 mb-6" size={64} />
            <h2 className="text-6xl font-black mb-2">
              {selectedResult.score}/10
            </h2>
            <p className="text-slate-400 font-bold uppercase text-sm">
              {selectedResult.quizTitle}
            </p>
          </div>

          {aiFeedback && (
            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] p-8 prose prose-indigo max-w-none mb-10 shadow-sm animate-in zoom-in-95">
              <h3 className="flex items-center gap-2 text-indigo-700 font-black mb-4">
                <GraduationCap /> Gia sư AI nhận xét:
              </h3>
              <ReactMarkdown>{aiFeedback}</ReactMarkdown>
            </div>
          )}

          <div className="space-y-10">
            <h3 className="text-2xl font-black text-slate-800 ml-2">
              Phân tích chi tiết câu hỏi:
            </h3>

            {(selectedResult.answers || []).map((answer: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2"
              >
                {/* 1. Nội dung câu hỏi và Số thứ tự */}
                <div className="flex gap-5 mb-8">
                  <div
                    className={`h-11 w-11 min-w-[44px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md ${answer.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}
                  >
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-slate-800 text-xl leading-relaxed mt-1">
                    {answer.questionContent}
                  </h4>
                </div>

                {/* 2. Danh sách 4 đáp án (A, B, C, D) hiển thị đầy đủ nội dung chữ */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {["A", "B", "C", "D"].map((label) => {
                    // Lấy nội dung chữ từ Backend gửi về (optionA, optionB...)
                    const optionText = answer[`option${label}`];

                    const isSelected = answer.selectedOption === label;
                    const isCorrect = answer.correctAnswer === label;

                    let containerStyle =
                      "bg-slate-50 border-slate-100 text-slate-600";
                    if (isCorrect) {
                      containerStyle =
                        "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20";
                    } else if (isSelected && !answer.isCorrect) {
                      containerStyle =
                        "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20";
                    }

                    return (
                      <div
                        key={label}
                        className={`flex items-center justify-between p-5 rounded-[1.8rem] border-2 transition-all ${containerStyle}`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`h-9 w-9 min-w-[36px] flex items-center justify-center rounded-xl font-black border-2 
                        ${isCorrect ? "border-emerald-300 bg-white" : isSelected ? "border-red-300 bg-white" : "border-slate-200 bg-white"}`}
                          >
                            {label}
                          </span>
                          {/* DÒNG QUAN TRỌNG: Hiển thị nội dung chữ của đáp án */}
                          <span className="font-bold text-[1rem]">
                            {optionText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Phần giải thích (Explanation) từ QuestionResponse */}
                <div className="bg-indigo-50/50 rounded-[2rem] p-7 border border-indigo-100 flex gap-5">
                  <div className="bg-white h-12 w-12 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <Info size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">
                      Gia sư AI hướng dẫn:
                    </p>
                    <p className="text-slate-700 leading-relaxed font-semibold text-[0.95rem]">
                      {answer.explanation ||
                        "Không có giải thích chi tiết cho câu hỏi này."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
