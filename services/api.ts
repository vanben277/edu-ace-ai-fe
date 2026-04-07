// services/api.ts
import axios from "axios";
import {
  ApiResponse,
  AuthResponse,
  Document,
  DashboardStats,
  Quiz,
  QuizResult,
  QuizHistoryResponse,
  InteractionResponse,
  User,
  QuizResultDetail,
} from "../types";

const API_BASE_URL = "https://edu-ace-ai.onrender.com/api";
// https://edu-ace.netlify.app http://localhost:8080/api

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
    // CHỈ ĐĂNG XUẤT KHI GẶP LỖI 401 (Hết hạn Token)
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      toast.error(
        "Bạn không có quyền thực hiện hành động này hoặc tài khoản bị hạn chế!",
      );
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: (data: any) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", data),
  register: (data: any) => api.post<ApiResponse<any>>("/auth/register", data),
};

export const documentApi = {
  getAll: () => api.get<ApiResponse<Document[]>>("/documents"),
  getById: (id: number) => api.get<ApiResponse<Document>>(`/documents/${id}`),
  upload: (formData: FormData) =>
    api.post<ApiResponse<Document>>("/documents/upload", formData),
  // Mới: API Xóa tài liệu
  delete: (id: number) => api.delete<ApiResponse<any>>(`/documents/${id}`),
};

export const aiApi = {
  chatGeneral: (message: string) =>
    api.post<ApiResponse<string>>("/ai/chat", { message }),
  chatOnDocument: (documentId: number, message: string) =>
    api.post<ApiResponse<string>>("/ai/chat-on-document", {
      documentId,
      message,
    }),
  getChatHistory: (documentId: number) =>
    api.get<ApiResponse<InteractionResponse[]>>(`/ai/history/${documentId}`),
  getQuizFeedback: (resultId: number) =>
    api.get<ApiResponse<string>>(`/ai/${resultId}/feedback`),
};

export const quizApi = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardStats>>("/quizzes/dashboard"),
  generate: (documentId: number, numberOfQuestions: number) =>
    api.post<ApiResponse<Quiz>>("/quizzes/generate", {
      documentId,
      numberOfQuestions,
    }),
  submit: (quizId: number, answers: Record<number, string>) =>
    api.post<ApiResponse<QuizResult>>("/quizzes/submit", { quizId, answers }),
  getHistory: () =>
    api.get<ApiResponse<QuizHistoryResponse[]>>("/quizzes/history"),

  // Mới: Các API phục vụ luồng Review/Retake
  getResult: (resultId: number) =>
    api.get<ApiResponse<QuizResultDetail>>(`/quizzes/result/${resultId}`),
  getQuizById: (quizId: number) =>
    api.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`),
};

export const adminApi = {
  getUsers: (params: any) =>
    api.get<ApiResponse<User[]>>("/admin/users", { params }),
  getAllSystemDocuments: () =>
    api.get<ApiResponse<Document[]>>("/admin/documents"),

  // SỬA TẠI ĐÂY: Đổi tên và đường dẫn cho khớp với Controller Java
  toggleUserStatus: (userId: number) =>
    api.post<ApiResponse<any>>(`/admin/users/${userId}/toggle-status`),

  deleteDocument: (docId: number) =>
    api.delete<ApiResponse<any>>(`/admin/documents/${docId}`),
};

import toast from "react-hot-toast"; // Đảm bảo import toast vào đây nếu dùng trong interceptor
export default api;
