import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  Shield,
  User as UserIcon,
  RefreshCw,
  Ban,
  CheckCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { User } from "../../types";
import toast from "react-hot-toast";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [enabled, setEnabled] = useState<string>("all"); // Mặc định là "all"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Xử lý params chuẩn xác
      const params: any = {
        search: search || undefined,
        role: role || undefined,
        sortBy,
        sortDir,
      };

      // Chỉ gửi enabled nếu không phải là "all"
      if (enabled === "true") params.enabled = true;
      if (enabled === "false") params.enabled = false;

      const response = await adminApi.getUsers(params);

      // Đảm bảo data luôn là mảng
      const incomingData = response.data?.data;
      setUsers(Array.isArray(incomingData) ? incomingData : []);

    } catch (err: any) {
      console.error("Fetch error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const actionText = user.enabled ? "Khóa" : "Mở khóa";
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${user.fullName}?`)) {
      try {
        // SỬA TẠI ĐÂY: Gọi đúng hàm toggleUserStatus
        await adminApi.toggleUserStatus(user.id);

        toast.success(`${actionText} thành công!`);
        fetchUsers(); // Tải lại danh sách
      } catch (err: any) {
        toast.error(`Thao tác thất bại: ${err.response?.data?.message || "Lỗi hệ thống"}`);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, role, enabled, sortBy, sortDir]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Users className="text-blue-600" /> Quản lý Người dùng
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
            Tổng cộng: {users?.length || 0}
          </span>
          <button onClick={fetchUsers} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Toolbar bộ lọc */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã số..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2.5 outline-none font-bold text-slate-600"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="STUDENT">Sinh viên</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>

        <select
          className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2.5 outline-none font-bold text-slate-600"
          value={enabled}
          onChange={(e) => setEnabled(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã bị khóa</option>
        </select>

        <select
          className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2.5 outline-none font-bold text-slate-600"
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split("-");
            setSortBy(field);
            setSortDir(dir);
          }}
        >
          <option value="createdAt-desc">Mới nhất</option>
          <option value="fullName-asc">Tên A-Z</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Người dùng</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Vai trò</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && users.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 animate-pulse font-bold">ĐANG TRUY XUẤT DỮ LIỆU...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold">KHÔNG TÌM THẤY NGƯỜI DÙNG NÀO</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white ${user.role === "ADMIN" ? "bg-indigo-600" : "bg-blue-500"}`}>
                        {user.fullName?.charAt(0) || "?"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{user.fullName}</span>
                        <span className="text-[11px] text-slate-400">{user.studentCode}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${user.enabled !== false ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                      {user.enabled !== false ? <CheckCircle size={12} /> : <Ban size={12} />}
                      {user.enabled !== false ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                    {user.role}
                  </td>
                  <td className="px-6 py-4">
                    {currentUser.studentCode !== user.studentCode && (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${user.enabled !== false
                            ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                      >
                        {user.enabled !== false ? <Lock size={14} /> : <Unlock size={14} />}
                        {user.enabled !== false ? "Khóa tài khoản" : "Mở khóa"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;