// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import StudyWorkspace from "./pages/StudyWorkspace";
import QuizEngine from "./pages/QuizEngine";
import QuizHistory from "./pages/QuizHistory"; // Import trang mới
import Login from "./pages/Login";
import AdminUsers from "./pages/admin/Users";
import SystemDocuments from "./pages/admin/SystemDocuments";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";
  const isStudyPage = location.pathname.startsWith("/study/");

  // Kiểm tra xem đã đăng nhập chưa
  const isAuthenticated = !!localStorage.getItem("access_token");

  // Nếu là trang Login hoặc chưa đăng nhập, không hiện Sidebar/Header
  if (isAuthPage || !isAuthenticated) return <>{children}</>;

  // Lấy thông tin user an toàn
  const getUserChar = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.fullName?.charAt(0).toUpperCase() || "U";
    } catch {
      return "U";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className={`flex-1 transition-all ${isStudyPage ? "md:ml-0" : "md:ml-64"}`}>
        {!isStudyPage && (
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 md:px-12">
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Hệ thống quản lý EduAce
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {getUserChar()}
              </div>
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access_token");
  // Nếu chưa đăng nhập, đẩy thẳng về login và xóa history cũ (replace)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          {/* MẶC ĐỊNH VÀO TRANG LOGIN */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          {/* CÁC TRANG BẢO VỆ CHO STUDENT */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
          <Route path="/study/:docId" element={<PrivateRoute><StudyWorkspace /></PrivateRoute>} />
          <Route path="/quizzes" element={<PrivateRoute><QuizEngine /></PrivateRoute>} />
          <Route path="/quiz-history" element={<PrivateRoute><QuizHistory /></PrivateRoute>} />

          {/* CÁC TRANG BẢO VỆ CHO ADMIN */}
          <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/all-documents" element={<PrivateRoute><SystemDocuments /></PrivateRoute>} />

          {/* BẤT KỲ ĐƯỜNG DẪN SAI NÀO CŨNG VỀ LOGIN */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;