import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { subjectApi } from "../services/api";
import { Subject, SubjectInput } from "../types";

export const SUBJECT_COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#475569",
];

interface SubjectFormProps {
  initial?: Subject | null;
  onCancel: () => void;
  onSaved: (subject: Subject) => void;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ initial, onCancel, onSaved }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? SUBJECT_COLORS[0]);
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
      const res = initial
        ? await subjectApi.update(initial.id, payload)
        : await subjectApi.create(payload);
      toast.success(initial ? "Đã cập nhật môn học" : "Đã tạo môn học");
      onSaved(res.data.data);
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
            autoFocus
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
            {SUBJECT_COLORS.map((c) => (
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

export default SubjectForm;
