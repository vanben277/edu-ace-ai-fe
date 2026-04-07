import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Upload,
  Clock,
  ExternalLink,
  Trash2, // Thêm icon thùng rác
} from "lucide-react";
import { documentApi } from "../services/api";
import { Document } from "../types";
import toast from "react-hot-toast";

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State cho ô tìm kiếm
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      const response = await documentApi.getAll();
      setDocs(response.data.data);
    } catch (err) {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // --- LOGIC MỚI: XOÁ TÀI LIỆU CÁ NHÂN ---
  const handleDeleteDoc = async (id: number, fileName: string) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xoá tài liệu "${fileName}" không? Hành động này sẽ xoá tất cả dữ liệu chat liên quan.`);
    
    if (isConfirm) {
      try {
        await documentApi.delete(id);
        toast.success("Đã xoá tài liệu thành công!");
        fetchDocs(); // Tải lại danh sách
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể xoá tài liệu");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Hiện tại hệ thống chỉ hỗ trợ định dạng PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await documentApi.upload(formData);
      toast.success("Tải tài liệu lên thành công!");
      fetchDocs();
    } catch (err) {
      toast.error("Tải tài liệu lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  // Logic lọc tài liệu theo tên
  const filteredDocs = docs.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài liệu của tôi</h1>
          <p className="text-slate-500">
            Quản lý tài liệu học tập và các tệp PDF của bạn.
          </p>
        </div>
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Đang xử lý AI..." : "Tải lên PDF"}
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm tài liệu của bạn..."
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {searchTerm ? "Không tìm thấy tài liệu phù hợp" : "Chưa có tài liệu nào"}
          </h3>
          <p className="mt-1 text-slate-500">
            {searchTerm ? "Thử tìm kiếm với từ khóa khác." : "Hãy tải lên tệp PDF đầu tiên để bắt đầu học cùng AI."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                {/* NÚT XOÁ TÀI LIỆU */}
                <button 
                  onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                  className="text-slate-300 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Xoá tài liệu"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <h3
                className="line-clamp-1 font-semibold text-slate-900"
                title={doc.fileName}
              >
                {doc.fileName}
              </h3>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Dung lượng: {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              <button
                onClick={() => navigate(`/study/${doc.id}`)}
                className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
              >
                Học ngay
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;