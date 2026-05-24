import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  FileText,
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { quizApi } from '../services/api';
import { DashboardStats } from '../types';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await quizApi.getDashboard();
        setStats(response.data.data);
      } catch (err) {
        toast.error('Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8">Đang tải bảng điều khiển...</div>;

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Tổng số tài liệu" 
          value={stats?.totalDocuments || 0} 
          icon={FileText} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Bài trắc nghiệm đã làm" 
          value={stats?.totalQuizzesTaken || 0} 
          icon={Award} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Điểm trung bình" 
          value={`${stats?.averageScore || 0}/10`} 
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Biểu đồ dùng stats?.progressChart */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats?.progressChart || []}> 
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" /> 
            <YAxis domain={[0, 10]} /> {/* Thang điểm 10 */}
            <Tooltip labelFormatter={(value) => `Ngày: ${value}`} />
            <Line type="monotone" dataKey="score" name="Điểm số" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;