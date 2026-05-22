// components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  BookMarked,
  History,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  X // Import icon đóng menu mobile
} from "lucide-react";
import toast from "react-hot-toast";

// Khai báo Props Interface
interface SidebarProps {
  isMobileOpen?: boolean;
  closeMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, closeMobile }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>("STUDENT");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserRole(user.role || "STUDENT");
      } catch (e) {
        setUserRole("STUDENT");
      }
    }
  }, []);

  // Tự động đóng menu trên mobile khi chọn trang
  const handleLinkClick = () => {
    if (closeMobile) closeMobile();
  };

  const handleLogout = () => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?");
    if (isConfirm) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      toast.success("Đã đăng xuất thành công!");
      navigate("/login");
    }
  };

  const studentItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { to: "/subjects", icon: BookMarked, label: "Môn học" },
    { to: "/documents", icon: FileText, label: "Tài liệu của tôi" },
    { to: "/quizzes", icon: BookOpen, label: "Trắc nghiệm AI" },
    { to: "/quiz-history", icon: History, label: "Lịch sử ôn tập" },
  ];

  const adminItems = [
    { to: "/admin/users", icon: Users, label: "Quản lý sinh viên" },
    { to: "/admin/all-documents", icon: ShieldCheck, label: "Tài liệu hệ thống" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
        ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-50">
        <div className={`flex items-center gap-2 text-blue-600 transition-all ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
          <GraduationCap className="h-8 w-8 min-w-[32px]" />
          <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            EduAce AI
          </span>
        </div>

        {/* Nút đóng trên Mobile */}
        <button 
          onClick={closeMobile}
          className="p-2 md:hidden text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        {/* Nút thu gọn trên Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-none">
        <p className={`px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ${isCollapsed ? "md:hidden" : ""}`}>
          Học tập
        </p>
        {studentItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                isActive 
                ? "bg-blue-50 text-blue-700 shadow-sm" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <item.icon size={20} />
            {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
          </NavLink>
        ))}

        {userRole === "ADMIN" && (
          <>
            <div className="my-4 border-t border-slate-100 mx-2"></div>
            <p className={`px-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 ${isCollapsed ? "md:hidden" : ""}`}>
              Quản trị viên
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-slate-600 hover:bg-indigo-50/30 hover:text-slate-900"
                  }`
                }
              >
                <item.icon size={20} />
                {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          {(!isCollapsed || isMobileOpen) && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;