import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { subjectApi } from "../services/api";
import { Subject, SubjectInput } from "../types";

const DEFAULT_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#475569",
];

interface SubjectFormProps {
  initial?: Subject | null;
  onCancel: () => void;
  onSaved: () => void;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ initial, onCancel, onSaved }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên môn học");
      return;
    }

    const payload: SubjectInput = {
      name: trimmed,
      description: description?.trim() || undefined,
      color,
    };

    setSaving(true);
    try {
      if (initial) {
        await subjectApi.update(initial.id, payload);
        toast.success("Đã cập nhật môn học");
      } else {
        await subjectApi.create(payload);
        toast.success("Đã tạo môn học");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không lưu được môn học");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {initial ? "Cập nhật môn học" : "Tạo môn học mới"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Tên môn học <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Lập trình Java, Cơ sở dữ liệu…"
            maxLength={150}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">
            Mô tả
          </span>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về môn học (tùy chọn)"
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <div className="mb-5">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Màu nhãn</span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === c ? "border-slate-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Chọn màu ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo môn"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Subject | null | undefined>(undefined);
  const navigate = useNavigate();

  const fetchSubjects = async () => {
    try {
      const res = await subjectApi.list();
      setSubjects(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không tải được danh sách môn học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (subject: Subject) => {
    const confirmed = window.confirm(
      `Xóa môn "${subject.name}"? Các tài liệu thuộc môn này sẽ chuyển sang "Chưa phân loại".`
    );
    if (!confirmed) return;

    try {
      await subjectApi.delete(subject.id);
      toast.success("Đã xóa môn học");
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không xóa được môn học");
    }
  };

  const onFormSaved = () => {
    setEditing(undefined);
    fetchSubjects();
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Môn học</h1>
          <p className="text-slate-500">
            Tổ chức tài liệu theo từng môn để dễ ôn tập và sinh trắc nghiệm chuyên đề.
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tạo môn học
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <BookMarked className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Chưa có môn học nào
          </h3>
          <p className="mt-1 text-slate-500">
            Tạo môn học đầu tiên để bắt đầu sắp xếp tài liệu của bạn.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="rounded-lg p-2 text-white"
                  style={{ backgroundColor: s.color || "#2563eb" }}
                >
                  <BookMarked className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-md p-1 text-slate-300 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="line-clamp-1 font-semibold text-slate-900" title={s.name}>
                {s.name}
              </h3>
              {s.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{s.description}</p>
              ) : (
                <p className="mt-1 text-xs italic text-slate-300">Không có mô tả</p>
              )}

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                {s.documentCount} tài liệu
              </div>

              <button
                onClick={() => navigate(`/subjects/${s.id}`)}
                className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white hover:border-blue-600"
              >
                Mở workspace
              </button>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <SubjectForm
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSaved={onFormSaved}
        />
      )}
    </div>
  );
};

export default Subjects;
