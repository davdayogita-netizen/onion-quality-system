import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ArrowLeft,
  Share2,
  AlertTriangle,
  CheckCircle,
  Scan,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Cpu
} from 'lucide-react';
import { getInspection, getReportDownloadUrl, analyzeInspection } from '../services/api';
import { InspectionDetail } from '../types';
import { ImageViewer } from '../components/inspection/ImageViewer';
import { GradeBadge } from '../components/ui/GradeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';

export const InspectionResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDefectIndex, setHoveredDefectIndex] = useState<number | null>(null);

  const fetchInspection = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getInspection(id);
      setInspection(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve inspection result.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection();
  }, [id]);

  const handleReanalyze = async () => {
    if (!id) return;
    setReanalyzing(true);
    try {
      await analyzeInspection(id);
      await fetchInspection();
    } catch (err: any) {
      alert(`Re-analysis failed: ${err.message}`);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-sm text-slate-400">Loading inspection findings...</div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-rose-300">Inspection Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'The requested inspection could not be loaded.'}</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
      </div>
    );
  }

  const reportUrl = getReportDownloadUrl(inspection.id);

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
                {inspection.id}
              </h1>
              <StatusBadge status={inspection.overall_status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(inspection.created_at).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                {inspection.inference_mode.toUpperCase()} MODE
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Analyzing...' : 'Re-Run CV'}</span>
          </button>

          <Link
            to={`/reports/${inspection.id}`}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Web Report</span>
          </Link>

          <a
            href={reportUrl}
            download
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left = Visualizer, Right = Score and Defect Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Image Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <ImageViewer
              originalUrl={inspection.image_url}
              annotatedUrl={inspection.annotated_image_url}
              processedUrl={inspection.processed_image_url}
              defects={inspection.defects}
              highlightedDefectIndex={hoveredDefectIndex}
            />
          </div>
        </div>

        {/* Right Column: Score, Grade, Defect Details, Explanations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quality Score & Grade Hero Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Quality Assessment
              </span>
              <GradeBadge grade={inspection.grade} size="lg" />
            </div>

            {/* Score Ring / Bar */}
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 font-mono tracking-tight">
                {inspection.quality_score?.toFixed(1) ?? 'N/A'}
              </span>
              <span className="text-slate-500 font-bold text-lg">/ 100</span>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, inspection.quality_score || 0)}%` }}
              />
            </div>

            {/* Key Summary Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Primary Defect</div>
                <div className="text-sm font-bold text-slate-200 capitalize mt-0.5">
                  {inspection.primary_defect || 'None (Clean)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Defect Zones</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {inspection.defect_count} detected
                </div>
              </div>
            </div>

            {/* Classification tier tag */}
            {inspection.classification_label && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Classification: <b>{inspection.classification_label}</b></span>
              </div>
            )}
          </div>

          {/* Contextual Human Explanation Box */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Assessment & Grading Explanation</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
              {inspection.explanation || 'No assessment explanation recorded for this lot.'}
            </p>
          </div>

          {/* Detected Defects Table */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Defect Breakdown
              </h3>
              <span className="text-xs text-slate-400">
                {inspection.defects.length} localized region(s)
              </span>
            </div>

            {inspection.defects.length === 0 || inspection.defects.every(d => d.type === 'healthy') ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-400 flex items-center justify-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Zero defect regions detected. Premium export condition.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {inspection.defects.map((defect, idx) => {
                  if (defect.type === 'healthy') return null;

                  const sevColor =
                    defect.severity === 'high'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : defect.severity === 'medium'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDefectIndex(idx)}
                      onMouseLeave={() => setHoveredDefectIndex(null)}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition" />
                        <div>
                          <div className="font-bold text-slate-200 capitalize text-sm">
                            {defect.type.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Coords: ({Math.round(defect.bbox.x)}, {Math.round(defect.bbox.y)}) • {Math.round(defect.bbox.width)}x{Math.round(defect.bbox.height)}px
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-300 font-semibold">
                          {Math.round(defect.confidence * 100)}%
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${sevColor}`}>
                          {defect.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
