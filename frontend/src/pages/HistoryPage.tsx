import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { getInspections, deleteInspection } from '../services/api';
import { PaginatedInspections } from '../types';
import { GradeBadge } from '../components/ui/GradeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<PaginatedInspections | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [defectFilter, setDefectFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getInspections({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        grade: gradeFilter || undefined,
        defect: defectFilter || undefined,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, gradeFilter, defectFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete inspection record ${id}?`)) return;
    try {
      await deleteInspection(id);
      fetchHistory();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Inspection History & Archive
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical log of computer-vision onion inspections, grades, and defect audits.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Inspection ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A (Premium)</option>
              <option value="B">Grade B (Commercial)</option>
              <option value="C">Grade C (Processing)</option>
              <option value="D">Grade D (Substandard)</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          {/* Defect filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Defect:</span>
            <select
              value={defectFilter}
              onChange={(e) => {
                setDefectFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Defects</option>
              <option value="rot">Rot / Decay</option>
              <option value="damage">Surface Damage</option>
              <option value="sprouting">Vegetative Sprout</option>
              <option value="quality_issue">Skin Blemish</option>
            </select>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Inspection ID</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Quality Score</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-4">Primary Defect</th>
                <th className="py-3.5 px-4">Defect Count</th>
                <th className="py-3.5 px-4">Inference Mode</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading inspection records...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No inspection records found matching your filters.
                  </td>
                </tr>
              ) : (
                data.items.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60">
                          {ins.annotated_image_url || ins.image_url ? (
                            <img
                              src={ins.annotated_image_url || ins.image_url}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">🧅</div>
                          )}
                        </div>
                        <span>{ins.id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(ins.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${ins.quality_score || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs font-mono">{ins.quality_score?.toFixed(1) ?? 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <GradeBadge grade={ins.grade} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs capitalize text-slate-300">
                      {ins.primary_defect || 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {ins.defect_count} zone(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                        {ins.inference_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inspection/${ins.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-semibold text-xs transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(ins.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {data && data.total_pages > 1 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing Page {data.page} of {data.total_pages} ({data.total} total records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
