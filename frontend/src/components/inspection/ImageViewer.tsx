import React, { useState } from 'react';
import { Defect } from '../../types';
import { Eye, Layers, Sparkles, ZoomIn } from 'lucide-react';

interface ImageViewerProps {
  originalUrl: string;
  annotatedUrl?: string;
  processedUrl?: string;
  defects: Defect[];
  highlightedDefectIndex?: number | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  originalUrl,
  annotatedUrl,
  processedUrl,
  defects,
  highlightedDefectIndex = null,
}) => {
  const [viewMode, setViewMode] = useState<'annotated' | 'original' | 'processed'>('annotated');
  const [showSvgOverlays, setShowSvgOverlays] = useState(true);

  // Fallback to original if annotated isn't available yet
  const currentImageUrl = 
    viewMode === 'original'
      ? originalUrl
      : viewMode === 'processed' && processedUrl
      ? processedUrl
      : (annotatedUrl || originalUrl);

  const getDefectColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rot':
        return '#ef4444'; // Red
      case 'damage':
        return '#f97316'; // Orange
      case 'sprouting':
        return '#22c55e'; // Green
      case 'quality_issue':
        return '#eab308'; // Yellow
      default:
        return '#10b981'; // Emerald
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Viewer controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setViewMode('annotated')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'annotated'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Annotated
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'original'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Original
          </button>
          {processedUrl && (
            <button
              type="button"
              onClick={() => setViewMode('processed')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'processed'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              OpenCV CLAHE
            </button>
          )}
        </div>

        {/* Overlay toggle */}
        <div className="flex items-center gap-3 pr-2 text-xs text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showSvgOverlays}
              onChange={(e) => setShowSvgOverlays(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Highlight Overlays</span>
          </label>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative w-full aspect-square max-h-[520px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center group">
        <img
          src={currentImageUrl}
          alt="Onion inspection scan"
          className="w-full h-full object-contain select-none"
        />

        {/* Interactive SVG Bounding Box overlay (enabled if active) */}
        {showSvgOverlays && viewMode !== 'annotated' && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 640 640"
            preserveAspectRatio="xMidYMid meet"
          >
            {defects.map((def, idx) => {
              if (def.type === 'healthy') return null;
              const isHovered = highlightedDefectIndex === idx;
              const color = getDefectColor(def.type);

              return (
                <g key={idx} className="transition-all duration-200">
                  {/* Bounding Box rectangle */}
                  <rect
                    x={def.bbox.x}
                    y={def.bbox.y}
                    width={def.bbox.width}
                    height={def.bbox.height}
                    fill={color}
                    fillOpacity={isHovered ? 0.35 : 0.15}
                    stroke={color}
                    strokeWidth={isHovered ? 3.5 : 2}
                    strokeDasharray={isHovered ? '4 2' : 'none'}
                    rx="4"
                  />

                  {/* Badge banner */}
                  <rect
                    x={def.bbox.x}
                    y={Math.max(0, def.bbox.y - 20)}
                    width={Math.min(180, def.bbox.width + 10)}
                    height="20"
                    fill={color}
                    rx="3"
                  />

                  {/* Text label */}
                  <text
                    x={def.bbox.x + 4}
                    y={Math.max(14, def.bbox.y - 5)}
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {def.type.toUpperCase()} ({Math.round(def.confidence * 100)}%)
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* View Mode Tag */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono text-slate-300">
          Viewing: <span className="text-emerald-400 font-bold uppercase">{viewMode}</span>
        </div>
      </div>
    </div>
  );
};
