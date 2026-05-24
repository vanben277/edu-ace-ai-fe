import axios from "axios";
import {
  ApiResponse,
  AuthResponse,
  Document,
  DashboardStats,
  Quiz,
  QuizResult,
  QuizResultResponse,
  QuizHistoryResponse,
  InteractionResponse,
  Subject,
  SubjectInput,
  ConversationDetail,
  ConversationSummary,
  ConversationMessageDto,
  User,
} from "../types";

const API_BASE_URL = "http://localhost:8090/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      toast.error("Bạn không có quyền thực hiện hành động này hoặc tài khoản bị hạn chế!");
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: (data: any) => api.post<ApiResponse<AuthResponse>>("/auth/login", data),
  register: (data: any) => api.post<ApiResponse<any>>("/auth/register", data),
};

export const documentApi = {
  getAll: (params?: { subjectId?: number; unassignedOnly?: boolean }) =>
    api.get<ApiResponse<Document[]>>("/documents", { params }),
  getById: (id: number) => api.get<ApiResponse<Document>>(`/documents/${id}`),
  upload: (formData: FormData) => api.post<ApiResponse<Document>>("/documents/upload", formData),
  uploadBatch: (formData: FormData) => api.post<ApiResponse<Document[]>>("/documents/upload-batch", formData),
  setSubject: (id: number, subjectId: number | null) =>
    api.put<ApiResponse<Document>>(`/documents/${id}/subject`, { subjectId }),
  delete: (id: number) => api.delete<ApiResponse<any>>(`/documents/${id}`),
};

export const subjectApi = {
  list: () => api.get<ApiResponse<Subject[]>>("/subjects"),
  getById: (id: number) => api.get<ApiResponse<Subject>>(`/subjects/${id}`),
  create: (data: SubjectInput) => api.post<ApiResponse<Subject>>("/subjects", data),
  update: (id: number, data: SubjectInput) => api.put<ApiResponse<Subject>>(`/subjects/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<any>>(`/subjects/${id}`),
};

export const conversationApi = {
  start: (data: { documentIds: number[]; message: string; subjectId?: number }) =>
    api.post<ApiResponse<ConversationDetail>>("/conversations/start", data),
  ask: (id: number, message: string) =>
    api.post<ApiResponse<ConversationMessageDto>>(`/conversations/${id}/ask`, { message }),
  list: (subjectId?: number) =>
    api.get<ApiResponse<ConversationSummary[]>>("/conversations", {
      params: subjectId != null ? { subjectId } : {},
    }),
  getDetail: (id: number) => api.get<ApiResponse<ConversationDetail>>(`/conversations/${id}`),
  delete: (id: number) => api.delete<ApiResponse<any>>(`/conversations/${id}`),
};

export const aiApi = {
  chatGeneral: (message: string) => api.post<ApiResponse<string>>("/ai/chat", { message }),
  chatOnDocument: (documentId: number, message: string) => api.post<ApiResponse<string>>("/ai/chat-on-document", { documentId, message }),
  chatOnDocuments: (documentIds: number[], message: string) =>
    api.post<ApiResponse<string>>("/ai/chat-on-documents", { documentIds, message }),
  getChatHistory: (documentId: number) => api.get<ApiResponse<InteractionResponse[]>>(`/ai/history/${documentId}`),
  getQuizFeedback: (resultId: number) => api.get<ApiResponse<string>>(`/ai/${resultId}/feedback`),
};

export const quizApi = {
  getDashboard: () => api.get<ApiResponse<DashboardStats>>("/quizzes/dashboard"),
  generate: (documentIds: number[], numberOfQuestions: number, topicHint?: string) =>
    api.post<ApiResponse<Quiz>>("/quizzes/generate", { documentIds, numberOfQuestions, topicHint }),
  submit: (quizId: number, answers: Record<number, string>) => api.post<ApiResponse<QuizResultResponse>>("/quizzes/submit", { quizId, answers }),
  getHistory: () => api.get<ApiResponse<QuizHistoryResponse[]>>("/quizzes/history"),
  getResult: (resultId: number) => api.get<ApiResponse<QuizResultResponse>>(`/quizzes/result/${resultId}`),
  getQuizById: (quizId: number) => api.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`),
};

export const adminApi = {
  getUsers: (params: any) => api.get<ApiResponse<User[]>>("/admin/users", { params }),
  getAllSystemDocuments: () => api.get<ApiResponse<Document[]>>("/admin/documents"),
  
  toggleUserStatus: (userId: number) => 
    api.post<ApiResponse<any>>(`/admin/users/${userId}/toggle-status`),

  deleteDocument: (docId: number) => api.delete<ApiResponse<any>>(`/admin/documents/${docId}`),
};

import toast from "react-hot-toast";
export default api;