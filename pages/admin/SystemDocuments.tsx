import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  HardDrive,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { adminApi, documentApi } from "../../services/api"; // Import thêm documentApi để dùng hàm delete
import { Document } from "../../types";
import toast from "react-hot-toast";

const SystemDocuments: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchAllDocs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllSystemDocuments();
      // Đảm bảo dữ liệu trả về là mảng để tránh lỗi .filter
      setDocs(response.data.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách tài liệu hệ thống");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocs();
  }, []);

  // LOGIC XOÁ TÀI LIỆU (Gọi sang DocumentController của BE)
  const handleDeleteDoc = async (id: number, fileName: string) => {
    const isConfirm = window.confirm(
      `XÁC NHẬN XOÁ HỆ THỐNG:\n"${fileName}"\n\nHành động này sẽ xoá vĩnh viễn tệp và các dữ liệu AI liên quan.`,
    );

    if (isConfirm) {
      try {
        // Sử dụng documentApi.delete (khớp với @DeleteMapping("/{id}") trong DocumentController)
        await documentApi.delete(id);

        toast.success("Xoá tài liệu thành công!");

        // Cập nhật State ngay tại chỗ để tài liệu biến mất khỏi bảng mà không cần load lại trang
        setDocs((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        // Nếu bạn đã sửa Interceptor trong api.ts như mình hướng dẫn trước đó,
        // lỗi 403 ở đây sẽ chỉ hiện thông báo lỗi chứ không bị logout.
        const errorMsg =
          err.response?.data?.message ||
          "Bạn không có quyền xoá hoặc lỗi hệ thống";
        toast.error(errorMsg);
      }
    }
  };

  const filteredDocs = docs.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase()),
  );

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <HardDrive className="text-indigo-600" /> Quản lý Kho tài liệu
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
            Tổng cộng: {docs.length}
          </span>
          <button
            onClick={fetchAllDocs}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu hệ thống theo tên..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tài liệu
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Chủ sở hữu
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Dung lượng
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && docs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-20 text-center text-slate-400 font-bold animate-pulse"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-400">
                  Không tìm thấy tài liệu phù hợp.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm line-clamp-1">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <User size={14} />
                      </div>
                      <span className="text-xs font-black">
                        {doc.ownerCode || "Hệ thống"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase">
                      {formatSize(doc.fileSize)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Nút Xem chi tiết nội dung */}
                      <button
                        onClick={() => navigate(`/study/${doc.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-100 bg-white transition-all flex items-center gap-2"
                        title="Xem nội dung tài liệu"
                      >
                        <ExternalLink size={16} />
                        <span className="text-[10px] font-bold">
                          XEM NỘI DUNG
                        </span>
                      </button>

                      {/* Nút Xoá tài liệu */}
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-100 bg-white transition-all"
                        title="Xoá vĩnh viễn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default SystemDocuments;
