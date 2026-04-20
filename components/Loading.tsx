import React from "react";

interface LoadingProps {
  /** Thông điệp hiển thị dưới spinner. Mặc định: "Đang tải cơ sở kiến thức của bạn..." */
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center max-w-sm text-center px-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-600">
          {message ?? "Đang tải cơ sở kiến thức của bạn..."}
        </p>
      </div>
    </div>
  );
};

export default Loading;
