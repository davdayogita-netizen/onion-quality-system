import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { getDashboardStats, createSampleInspection } from '../services/api';
import { DashboardStats } from '../types';
import { GradeBadge } from '../components/ui/GradeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickTestLoading, setQuickTestLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickTest = async (type: string) => {
    setQuickTestLoading(true);
    try {
      const res = await createSampleInspection(type);
      navigate(`/inspect?id=${res.id}&autoAnalyze=true`);
    } catch (err: any) {
      alert(`Error starting quick test: ${err.message}`);
    } finally {
      setQuickTestLoading(false);
    }
  };

  const GRADE_COLORS: Record<string, string> = {
    A: '#10b981', // Emerald
    B: '#3b82f6', // Blue
    C: '#f59e0b', // Amber
    D: '#f97316', // Orange
    Reject: '#f43f5e', // Crimson
  };

  const DEFECT_COLORS = ['#f43f5e', '#f97316', '#10b981', '#eab308', '#06b6d4'];

  const gradeChartData = stats
    ? Object.entries(stats.grade_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const defectChartData = stats
    ? Object.entries(stats.defect_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        count: value,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Quality Inspection Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time optical metrics, defect distributions, and AI grading analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/inspect"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition flex items-center gap-2"
          >
            <ScanSearch className="w-4 h-4" />
            Inspect Onion
          </Link>
        </div>
      </div>

      {/* Quick Sample Demo Launcher */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">Instant Demo Test Samples</h4>
            <p className="text-xs text-slate-400">
              Run one-click computer-vision inspection with pre-configured defect profiles
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={quickTestLoading}
            onClick={() => handleQuickTest('healthy')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          >
            Healthy (Grade A)
          </button>
          <button
            disabled={quickTestLoading}
            onClick={() => handleQuickTest('damage')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
          >
            Damaged (Grade B)
          </button>
          <button
            disabled={quickTestLoading}
            onClick={() => handleQuickTest('sprouting')}
            className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold transition"
          >
            Sprouting (Grade C)
          </button>
          <button
            disabled={quickTestLoading}
            onClick={() => handleQuickTest('rot')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
          >
            Decay Rot (Reject)
          </button>
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Inspections */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">
              {loading ? '...' : stats?.total_inspections.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{stats?.inspections_today} scans today</span>
            </div>
          </div>
        </div>

        {/* Average Quality Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {loading ? '...' : `${stats?.average_quality_score}/100`}
            </div>
            <div className="text-xs text-slate-400 mt-1">Weighted CV assessment</div>
          </div>
        </div>

        {/* Good Quality Ratio */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Good Quality</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-blue-400">
              {loading ? '...' : stats?.good_quality_count.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Grade A & Grade B lots</div>
          </div>
        </div>

        {/* Defective / Degraded Lots */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Defective Lots</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-rose-400">
              {loading ? '...' : stats?.defective_count.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Grade C, D & Rejected</div>
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-teal-400">
              {stats && stats.total_inspections > 0
                ? `${Math.round((stats.good_quality_count / stats.total_inspections) * 100)}%`
                : '100%'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Commercial marketability</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Grades Distribution (Donut Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Grade Distribution
            </h3>
            <span className="text-xs text-slate-500 font-mono">Classes A - Reject</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {gradeChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={GRADE_COLORS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {gradeChartData.map((g) => (
              <div key={g.name} className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="font-bold" style={{ color: GRADE_COLORS[g.name] || '#94a3b8' }}>
                  {g.name}: {g.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Distribution (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Defect Category Frequency
            </h3>
            <span className="text-xs text-slate-500 font-mono">Detected Zones</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {defectChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Inspection & Quality Trends */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Inspection Activity & Quality Trend
            </h3>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avg_score"
                  name="Avg Quality Score"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table Preview */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Onion Inspections</h3>
            <p className="text-xs text-slate-400">Latest agricultural lots processed by CV pipeline</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            View Full History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Inspection</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Quality Score</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Primary Defect</th>
                <th className="py-3 px-4">Defects</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.recent_inspections.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60">
                        {ins.annotated_image_url || ins.image_url ? (
                          <img
                            src={ins.annotated_image_url || ins.image_url}
                            alt="Onion"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">🧅</div>
                        )}
                      </div>
                      <span>{ins.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {new Date(ins.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${ins.quality_score || 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs">{ins.quality_score ?? 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <GradeBadge grade={ins.grade} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-xs capitalize text-slate-300">
                    {ins.primary_defect || 'None'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {ins.defect_count} zone(s)
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/inspection/${ins.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-semibold text-xs transition"
                    >
                      View Result
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
