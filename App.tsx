// App.tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Menu } from "lucide-react"; // Thêm icon Menu
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import StudyWorkspace from "./pages/StudyWorkspace";
import MultiDocStudy from "./pages/MultiDocStudy";
import QuizEngine from "./pages/QuizEngine";
import QuizHistory from "./pages/QuizHistory";
import Login from "./pages/Login";
import AdminUsers from "./pages/admin/Users";
import SystemDocuments from "./pages/admin/SystemDocuments";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAuthPage = location.pathname === "/login";
  const isStudyPage = location.pathname.startsWith("/study/");
  const isAuthenticated = !!localStorage.getItem("access_token");

  if (isAuthPage || !isAuthenticated) return <>{children}</>;

  const getUserChar = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.fullName?.charAt(0).toUpperCase() || "U";
    } catch {
      return "U";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* SIDEBAR: Truyền thêm Props để đóng mở trên mobile */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        closeMobile={() => setIsMobileOpen(false)} 
      />

      {/* LỚP PHỦ (OVERLAY): Hiện khi mở menu trên mobile để bấm ra ngoài là đóng */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <main className={`flex-1 transition-all ${isStudyPage ? "md:ml-0" : "md:ml-64"}`}>
        {!isStudyPage && (
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-12 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* NÚT MỞ SIDEBAR TRÊN MOBILE */}
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-600"
              >
                <Menu size={20} />
              </button>
              
              <h1 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest truncate">
                Trợ lý học tập cá nhân
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {getUserChar()}
              </div>
            </div>
          </header>
        )}
        
        {/* Container cho nội dung chính */}
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("access_token");
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/subjects" element={<PrivateRoute><Subjects /></PrivateRoute>} />
          <Route path="/subjects/:id" element={<PrivateRoute><SubjectDetail /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
          <Route path="/study/:docId" element={<PrivateRoute><StudyWorkspace /></PrivateRoute>} />
          <Route path="/study-multi" element={<PrivateRoute><MultiDocStudy /></PrivateRoute>} />
          <Route path="/quizzes" element={<PrivateRoute><QuizEngine /></PrivateRoute>} />
          <Route path="/quiz-history" element={<PrivateRoute><QuizHistory /></PrivateRoute>} />

          <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/all-documents" element={<PrivateRoute><SystemDocuments /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;