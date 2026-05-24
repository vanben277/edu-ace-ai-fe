import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, User, Lock, Key } from "lucide-react";
import { authApi } from "../services/api";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    studentCode: "",
    fullName: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "ADMIN") {
          navigate("/admin/users", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        localStorage.clear(); 
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login({
          studentCode: formData.studentCode,
          password: formData.password
        });

        const authData = response.data.data;

        if (authData.enabled === false) {
          toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!");
          setLoading(false);
          return;
        }

        localStorage.setItem("access_token", authData.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            studentCode: authData.studentCode,
            fullName: authData.fullName,
            role: authData.role,
            enabled: authData.enabled,
          }),
        );

        toast.success(`Chào mừng trở lại, ${authData.fullName}!`);

        if (authData.role === "ADMIN") {
          navigate("/admin/users");
        } else {
          navigate("/dashboard");
        }
      } else {
        await authApi.register({
          studentCode: formData.studentCode,
          fullName: formData.fullName,
          password: formData.password
        });
        toast.success("Đã tạo tài khoản thành công! Bây giờ bạn có thể đăng nhập.");
        setIsLogin(true); 
        setFormData({ ...formData, password: "" });
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Truy cập bị từ chối: Tài khoản này đã bị cấm!");
      } else {
        const msg = err.response?.data?.message || "Xác thực không thành công. Vui lòng kiểm tra lại.";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            EduAce AI
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            {isLogin
              ? "Chào mừng bạn trở lại, sinh viên."
              : "Bắt đầu hành trình học tập cùng trợ lý AI."}
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Student Code */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700 ml-1">
                Mã sinh viên
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="VD: 522100025"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                  value={formData.studentCode}
                  onChange={(e) =>
                    setFormData({ ...formData, studentCode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Input Full Name (Chỉ hiện khi Đăng ký) */}
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="mb-1.5 block text-sm font-bold text-slate-700 ml-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Input Password */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isLogin ? (
                "ĐĂNG NHẬP"
              ) : (
                "TẠO TÀI KHOẢN"
              )}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isLogin
                ? "Chưa có tài khoản? Đăng ký ngay"
                : "Đã có tài khoản? Quay lại đăng nhập"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
          Hệ thống bảo mật bởi EduAce AI Security
        </p>
      </div>
    </div>
  );
};

export default Login;