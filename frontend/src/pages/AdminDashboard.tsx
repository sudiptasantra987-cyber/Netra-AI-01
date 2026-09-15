import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Server, 
  Database, 
  RefreshCw, 
  Eye, 
  Filter,
  Download,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface AdminDashboardProps {
  setActiveTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Screenings Trend data for chart matching Screen 11
  const trendData7d = [
    { day: 'Mon', screenings: 45, highRisk: 4 },
    { day: 'Tue', screenings: 58, highRisk: 6 },
    { day: 'Wed', screenings: 62, highRisk: 5 },
    { day: 'Thu', screenings: 84, highRisk: 11 },
    { day: 'Fri', screenings: 96, highRisk: 9 },
    { day: 'Sat', screenings: 72, highRisk: 8 },
    { day: 'Sun', screenings: 48, highRisk: 3 },
  ];

  const trendData30d = [
    { day: 'Week 1', screenings: 320, highRisk: 28 },
    { day: 'Week 2', screenings: 410, highRisk: 34 },
    { day: 'Week 3', screenings: 495, highRisk: 41 },
    { day: 'Week 4', screenings: 560, highRisk: 48 },
  ];

  const currentChartData = timeRange === '7d' ? trendData7d : trendData30d;

  // Recent activity stream matching Screen 11
  const recentActivities = [
    {
      id: 1,
      title: 'Dr. Rajesh Sharma verified',
      category: 'Doctor Onboarding',
      time: '10m ago',
      type: 'success',
      icon: Stethoscope
    },
    {
      id: 2,
      title: 'High Risk Glaucoma flagged',
      category: 'AI Engine Alert',
      time: '25m ago',
      type: 'danger',
      icon: AlertTriangle
    },
    {
      id: 3,
      title: 'Appointment booked: Priya Sen',
      category: 'Consultation Triage',
      time: '42m ago',
      type: 'info',
      icon: Calendar
    },
    {
      id: 4,
      title: 'ABDM Health Records Bridge synced',
      category: 'System Integration',
      time: '1h ago',
      type: 'success',
      icon: Server
    },
    {
      id: 5,
      title: 'Quality Gate v4.2 calibrated',
      category: 'Algorithm Update',
      time: '3h ago',
      type: 'neutral',
      icon: Activity
    },
    {
      id: 6,
      title: 'Clinical batch audit generated',
      category: 'Compliance',
      time: '5h ago',
      type: 'neutral',
      icon: FileCheck
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Section matching Screen 11 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0756B8]/10 text-[#0756B8] border border-[#0756B8]/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0756B8]" />
            <span>Netra AI System Administration</span>
          </div>
          <h2 className="text-2xl font-bold text-[#071426] tracking-tight">
            Admin Dashboard - System Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry, screening throughput, verified specialists, and high-risk case triage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-2xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0756B8]' : ''}`} />
          </button>

          <button
            onClick={() => alert('Exporting comprehensive system audit report (PDF/CSV)...')}
            className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs shadow-md shadow-[#0756B8]/20 flex items-center space-x-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Metric Cards matching Screen 11 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0756B8]/10 text-[#0756B8] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#071426] mt-3">
            1,248
          </div>
          <div className="text-xs text-[#0756B8] font-semibold mt-1 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+12% this month</span>
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Doctors
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#19C7E8]/15 text-[#0756B8] flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#071426] mt-3">
            86
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Verified specialists active
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Appointments
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#0756B8]/10 text-[#0756B8] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#071426] mt-3">
            54
          </div>
          <div className="text-xs text-[#0756B8] font-medium mt-1">
            +8 compared to yesterday
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="bg-white rounded-2xl p-5 border border-red-200/80 bg-red-50/20 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              High Risk Cases
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-3">
            18
          </div>
          <div className="text-xs text-red-700 font-medium mt-1">
            Priority doctor review required
          </div>
        </div>
      </div>

      {/* Main Grid: Screenings Trend Chart + Recent Activity matching Screen 11 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Screenings Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#0756B8]" />
                <span>Screenings Trend</span>
              </h3>
              <p className="text-xs text-slate-500">
                Daily volumetric analysis of AI ocular scans processed
              </p>
            </div>

            {/* Time Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === '7d' 
                    ? 'bg-white text-[#0756B8] shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === '30d' 
                    ? 'bg-white text-[#0756B8] shadow-2xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="screeningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0756B8" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#0756B8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#071426', 
                    borderRadius: '12px', 
                    color: '#ffffff',
                    border: '1px solid rgba(25, 199, 232, 0.3)',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#19C7E8' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="screenings" 
                  name="Screenings"
                  stroke="#0756B8" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#screeningsGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50">
              <div className="text-[11px] text-slate-500 font-medium">Quality Gate Pass</div>
              <div className="text-base font-bold text-[#0756B8] mt-0.5">98.4%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <div className="text-[11px] text-slate-500 font-medium">Avg. Latency</div>
              <div className="text-base font-bold text-[#071426] mt-0.5">1.24s</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <div className="text-[11px] text-slate-500 font-medium">Auto-Triage Acc</div>
              <div className="text-base font-bold text-[#0756B8] mt-0.5">99.1%</div>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Feed matching Screen 11 (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#071426] flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#0756B8]" />
              <span>Recent Activity</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Live stream</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => {
              const IconComp = act.icon;
              return (
                <div key={act.id} className="py-3.5 flex items-start space-x-3 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    act.type === 'danger' 
                      ? 'bg-red-50 text-red-600' 
                      : act.type === 'success' 
                      ? 'bg-[#19C7E8]/15 text-[#0756B8]' 
                      : 'bg-[#0756B8]/10 text-[#0756B8]'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#071426] truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {act.category}
                    </div>
                  </div>

                  <div className="text-[10px] font-medium text-slate-400 shrink-0">
                    {act.time}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => alert('All specialists are currently verified with medical council licenses.')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-center border border-slate-200 transition-colors"
              >
                Verify Doctors (86)
              </button>
              <button 
                onClick={() => alert('Ayushman Bharat Digital Mission (ABDM) Gateway is Operational.')}
                className="p-2 rounded-xl bg-[#0756B8]/10 hover:bg-[#0756B8]/15 text-[#0756B8] font-semibold text-center border border-[#0756B8]/20 transition-colors"
              >
                ABDM Bridge Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
