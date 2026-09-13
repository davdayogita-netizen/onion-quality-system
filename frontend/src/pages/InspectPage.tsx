import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileImage,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Camera,
  Layers,
  CheckCircle
} from 'lucide-react';
import { uploadImage, createSampleInspection, analyzeInspection } from '../services/api';
import { AnalysisStepper } from '../components/inspection/AnalysisStepper';

export const InspectPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inspectionId, setInspectionId] = useState<string | null>(searchParams.get('id'));
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-analyze triggered from dashboard quick sample button
  useEffect(() => {
    const autoAnalyze = searchParams.get('autoAnalyze');
    const paramId = searchParams.get('id');
    if (autoAnalyze === 'true' && paramId && !isAnalyzing) {
      handleRunAnalysis(paramId);
    }
  }, [searchParams]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 15MB. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setInspectionId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setInspectionId(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile && !inspectionId) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      let targetId = inspectionId;
      if (!targetId && selectedFile) {
        const uploadRes = await uploadImage(selectedFile);
        targetId = uploadRes.id;
        setInspectionId(targetId);
      }

      if (targetId) {
        setIsUploading(false);
        await handleRunAnalysis(targetId);
      }
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Image upload failed. Please verify server connection.');
    }
  };

  const handleRunAnalysis = async (targetId: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await analyzeInspection(targetId);
      // Wait momentarily for smooth stepper transition
      setTimeout(() => {
        navigate(`/inspection/${result.inspection_id}`);
      }, 700);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'Inspection analysis failed.');
    }
  };

  const handleQuickSampleSelect = async (sampleType: string) => {
    handleClear();
    setIsUploading(true);
    try {
      const res = await createSampleInspection(sampleType);
      setInspectionId(res.id);
      setPreviewUrl(res.image_url);
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Failed to initialize sample image.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <span>Inspect Onion Image</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload high-resolution onion bulb photography for automated defect detection and grading.
        </p>
      </div>

      {isAnalyzing ? (
        <AnalysisStepper isAnalyzing={isAnalyzing} error={errorMessage} />
      ) : (
        <div className="space-y-6">
          {/* Main Drag & Drop / Preview Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-200">
                    Click to browse or drag and drop onion photo
                  </div>
                  <div className="text-xs text-slate-400">
                    Accepted image formats: JPG, JPEG, PNG, WebP (Max 15MB)
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs font-medium text-slate-300 border border-slate-700">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Optimal: Single onion bulb with neutral backdrop</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full max-h-[460px] aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Onion Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-rose-500/80 transition shadow-lg"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs text-slate-300 font-mono">
                    {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Preloaded Sample Image'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                  >
                    Change Image
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadAndAnalyze}
                    disabled={isUploading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Run Quality Inspection'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Preset Sample Gallery for Testing */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Load Pre-Configured Test Profiles</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Quick Validation</span>
            </div>

            <p className="text-xs text-slate-400">
              Don't have an onion image handy? Click any sample profile below to test the computer-vision detection pipeline immediately:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleQuickSampleSelect('healthy')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-left space-y-1 group"
              >
                <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  Healthy Bulb
                </div>
                <div className="text-[11px] text-slate-400">Target Grade A</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSampleSelect('damage')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition text-left space-y-1 group"
              >
                <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  Surface Cut / Peel
                </div>
                <div className="text-[11px] text-slate-400">Target Grade B</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSampleSelect('sprouting')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-green-500/50 hover:bg-green-500/5 transition text-left space-y-1 group"
              >
                <div className="text-xs font-bold text-green-400 group-hover:text-green-300">
                  Active Sprouting
                </div>
                <div className="text-[11px] text-slate-400">Target Grade C</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSampleSelect('rot')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 transition text-left space-y-1 group"
              >
                <div className="text-xs font-bold text-rose-400 group-hover:text-rose-300">
                  Fungal Rot / Decay
                </div>
                <div className="text-[11px] text-slate-400">Target Reject</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
