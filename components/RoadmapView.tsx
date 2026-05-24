// components/RoadmapView.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Map,
  Target,
  CalendarDays,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { LearningRoadmapResponse } from "../types";

interface RoadmapViewProps {
  roadmap: LearningRoadmapResponse | null | undefined;
  servedBy?: string | null;
  
  onTargetedPractice?: (topicHint: string) => void;

  onStartFresh?: () => void;
}

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  CAO: { bg: "bg-red-100", text: "text-red-700", label: "Ưu tiên cao" },
  TRUNG_BINH: { bg: "bg-amber-100", text: "text-amber-700", label: "Trung bình" },
  THAP: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Thấp" },
};

const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  onTargetedPractice,
}) => {
  const navigate = useNavigate();

  const handleTargetedClick = (topic: string): void => {
    if (onTargetedPractice) {
      onTargetedPractice(topic);
      return;
    }
    navigate("/quizzes");
  };

  if (!roadmap) {
    return (
      <div className="bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] p-8 flex items-start gap-4">
        <AlertCircle className="text-amber-500 shrink-0 mt-1" size={28} />
        <div>
          <h3 className="font-black text-amber-700 text-lg mb-1">
            Lộ trình AI chưa sẵn sàng
          </h3>
          <p className="text-amber-600 text-sm font-semibold">
            Hệ thống AI tạm thời không phản hồi. Bạn vẫn có thể xem chi tiết câu sai bên dưới để tự ôn lại.
          </p>
        </div>
      </div>
    );
  }

  const weakTopics = roadmap.weakTopics ?? [];
  const studyPlan = roadmap.studyPlan ?? [];

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      {/* Header với badge tier phục vụ */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Map size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lộ trình học tập cá nhân</h2>
            <p className="text-slate-500 text-sm font-bold mt-1">
              AI phân tích từ những câu bạn còn yếu
            </p>
          </div>
        </div>
      </div>

      {/* Overall comment */}
      {roadmap.overallComment && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-3xl p-6 mb-8">
          <p className="text-slate-700 leading-relaxed font-semibold text-base">
            {roadmap.overallComment}
          </p>
        </div>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="mb-10">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            <Target size={14} /> Chủ đề cần lưu ý
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {weakTopics.map((topic, idx) => {
              const style =
                priorityStyles[topic.priority?.toUpperCase()] ?? priorityStyles.TRUNG_BINH;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTargetedClick(topic.topic)}
                  aria-label={`Luyện tập ngay chủ đề ${topic.topic}`}
                  className="group flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-blue-400 hover:bg-white hover:shadow-md cursor-pointer transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700">
                      {topic.topic}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      {topic.wrongCount} câu sai · Bấm để luyện tập ngay
                    </p>
                  </div>
                  <span
                    className={`ml-3 ${style.bg} ${style.text} text-[10px] font-black uppercase px-3 py-1.5 rounded-full whitespace-nowrap`}
                  >
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Study plan timeline */}
      {studyPlan.length > 0 && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            <CalendarDays size={14} /> Kế hoạch học {studyPlan.length} ngày
          </h3>
          <div className="space-y-4">
            {studyPlan.map((step, idx) => (
              <div
                key={idx}
                className="flex gap-5 bg-white border-2 border-slate-50 rounded-2xl p-5 transition-all cursor-default"
              >
                <div className="shrink-0 h-12 w-12 rounded-2xl bg-blue-600 text-white font-black flex flex-col items-center justify-center shadow-md shadow-blue-200">
                  <span className="text-[8px] uppercase">Ngày</span>
                  <span className="text-base leading-none">{step.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-base mb-1.5">{step.topic}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                    <span className="text-blue-600 font-black">Mục tiêu: </span>
                    {step.goal}
                  </p>
                  {step.practice && (
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold mt-2">
                      <span className="text-indigo-500 font-black uppercase tracking-wider">Bài tập: </span>
                      {step.practice}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next step — text callout tĩnh, KHÔNG phải button (tránh false affordance).
          Action cụ thể nằm ở 3 buttons của result screen (Làm lại đề / Đề khác / Lịch sử)
          và ở các weak topic cards clickable phía trên. */}
      {roadmap.nextStepSuggestion && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 mb-1">
              Gợi ý tiếp theo từ AI
            </p>
            <p className="font-semibold text-slate-700 text-sm leading-relaxed">
              {roadmap.nextStepSuggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapView;
