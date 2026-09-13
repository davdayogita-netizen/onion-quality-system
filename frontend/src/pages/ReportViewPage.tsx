import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { getInspection, getReportDownloadUrl } from '../services/api';
import { InspectionDetail } from '../types';
import { GradeBadge } from '../components/ui/GradeBadge';

export const ReportViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getInspection(id)
        .then(setInspection)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-sm text-slate-400">Loading audit report...</div>
      </div>
    );
  }

  if (!inspection) {
    return <div className="text-center py-12 text-slate-400">Report not found.</div>;
  }

  const reportUrl = getReportDownloadUrl(inspection.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action toolbar (hidden on print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inspection
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <a
            href={reportUrl}
            download
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download Official PDF
          </a>
        </div>
      </div>

      {/* Printable Report Document Surface */}
      <div className="p-8 md:p-12 rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧅</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                AI-BASED ONION QUALITY ASSESSMENT REPORT
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Smart India Hackathon 2026 • Automated Computer-Vision Grading Platform
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500">
            <div>CONFIDENTIAL AUDIT</div>
            <div className="font-bold text-slate-900 mt-1">{inspection.id}</div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Inspection ID</span>
            <div className="font-bold font-mono text-slate-900 text-sm">{inspection.id}</div>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Timestamp</span>
            <div className="font-bold text-slate-900">
              {new Date(inspection.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Quality Score</span>
            <div className="font-bold text-slate-900 text-sm">
              {inspection.quality_score?.toFixed(1) ?? 'N/A'} / 100
            </div>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px]">Quality Grade</span>
            <div className="font-black text-emerald-700 text-base">
              Grade {inspection.grade || 'N/A'}
            </div>
          </div>
        </div>

        {/* Images: Original vs AI Annotated */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
            Visual Inspection & AI Defect Localization
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center">
                <img
                  src={inspection.image_url}
                  alt="Raw Onion"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs font-bold text-slate-700">Raw Input Photography</div>
            </div>

            <div className="space-y-2 text-center">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center">
                <img
                  src={inspection.annotated_image_url || inspection.image_url}
                  alt="AI Annotated"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs font-bold text-slate-700">AI Annotated HUD Overlay</div>
            </div>
          </div>
        </div>

        {/* Defects Details Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
            Detected Defect Breakdown ({inspection.defects.length} zones)
          </h2>

          <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Defect Category</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Bounding Box (X, Y, W, H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inspection.defects.length === 0 || inspection.defects.every(d => d.type === 'healthy') ? (
                <tr>
                  <td colSpan={4} className="py-4 px-3 text-center text-emerald-700 font-semibold">
                    ✓ Clean specimen. No visible physical rot, sprouting, or tissue degradation.
                  </td>
                </tr>
              ) : (
                inspection.defects.map((d, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-2.5 px-3 font-bold capitalize text-slate-900">{d.type}</td>
                    <td className="py-2.5 px-3 font-mono">{Math.round(d.confidence * 100)}%</td>
                    <td className="py-2.5 px-3 font-bold uppercase">
                      <span className={d.severity === 'high' ? 'text-red-600' : d.severity === 'medium' ? 'text-orange-600' : 'text-emerald-700'}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      ({Math.round(d.bbox.x)}, {Math.round(d.bbox.y)}, {Math.round(d.bbox.width)}x{Math.round(d.bbox.height)})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quality Assessment Explanation */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-bold uppercase text-slate-700">Grading Explanation & Rationale</h3>
          <p className="text-xs leading-relaxed text-slate-800 italic">
            "{inspection.explanation || 'Graded in accordance with SIH 2026 computer-vision baseline thresholds.'}"
          </p>
        </div>

        {/* Model Audit Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            System Engine: <span className="font-bold text-slate-800">{inspection.model_version}</span> ({inspection.inference_mode.toUpperCase()} MODE)
          </div>
          <div>Generated by AI Onion Inspection Platform</div>
        </div>
      </div>
    </div>
  );
};
