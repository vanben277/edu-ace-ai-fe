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

// Cấu trúc cho màn hình Review (Chi tiết kết quả)
export interface QuizResultDetail {
  id: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
  quiz: Quiz;
  // Map lưu đáp án sinh viên đã chọn (ID câu hỏi -> Đáp án A/B/C/D)
  userAnswers: Record<number, string>; 
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
  userAnswers: UserAnswerResponse[]; // Danh sách đáp án chi tiết
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