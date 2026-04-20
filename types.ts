// types.ts

export interface ApiResponse<T> {
  message: string;
  data: T;
  errorMessage: string | null;
}

export interface User {
  id: number;
  studentCode: string;
  fullName: string;
  role: "STUDENT" | "ADMIN";
  enabled: boolean; // BE dùng boolean: true là hoạt động, false là bị khóa
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  studentCode: string;
  fullName: string;
  role: "STUDENT" | "ADMIN";
  enabled: boolean; // Đồng bộ với User
}

export interface Document {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  ownerCode?: string;
  createdAt: string;
  content?: string;
}

// LearningRoadmap structured output từ AI (khớp với LearningRoadmapResponse.java)
export interface WeakTopic {
  topic: string;
  wrongCount: number;
  priority: "CAO" | "TRUNG_BINH" | "THAP" | string;
}

export interface StudyStep {
  day: number;
  topic: string;
  goal: string;
  practice: string;
}

export interface LearningRoadmapResponse {
  overallComment: string;
  weakTopics: WeakTopic[] | null;
  studyPlan: StudyStep[] | null;
  nextStepSuggestion: string;
}

export interface Question {
  id: number;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

export interface QuizResult {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  completedAt: string;
}

export interface QuestionResponse {
  id: number;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

export interface QuizResponse {
  id: number;
  title: string;
  documentId: number;
  questions: QuestionResponse[];
  createdAt: string;
}

export interface UserAnswerResponse {
  questionId: number;
  questionContent: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResultResponse {
  id: number;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  completedAt: string;
  answers: UserAnswerResponse[];          // Danh sách câu trả lời chi tiết (BE field name)
  quizId: number;                         // Để hỗ trợ "Làm lại"
  roadmap: LearningRoadmapResponse | null; // Lộ trình AI sinh kèm khi submit
  roadmapServedBy: string | null;         // Tier nào đã phục vụ (gemini/groq)
}

export interface DashboardStats {
  totalDocuments: number;
  totalQuizzesTaken: number;
  averageScore: number;
  progressChart: { date: string; score: number }[];
}

export interface QuizHistoryResponse {
  id: number;
  quizTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
}

export interface InteractionResponse {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}