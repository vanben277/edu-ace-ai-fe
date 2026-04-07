
import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Đang tải cơ sở kiến ​​thức của bạn...</p>
      </div>
    </div>
  );
};

export default Loading;
