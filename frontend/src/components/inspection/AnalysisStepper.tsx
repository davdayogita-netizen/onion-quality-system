import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AnalysisStepperProps {
  isAnalyzing: boolean;
  onComplete?: () => void;
  error?: string | null;
}

const STAGES = [
  { id: 1, title: 'Image Upload & Validation', desc: 'Checking format, resolution, and color channels' },
  { id: 2, title: 'OpenCV Preprocessing', desc: 'Applying CLAHE contrast and bilateral denoising' },
  { id: 3, title: 'AI Defect Detection', desc: 'Scanning for rot, damage, sprouting, and tunic peel defects' },
  { id: 4, title: 'Quality Classification', desc: 'Inferring bulb firmness and marketability category' },
  { id: 5, title: 'Quality Score & Grade Computation', desc: 'Calculating deductions and agricultural quality grade' },
  { id: 6, title: 'Generating Visual HUD & Report', desc: 'Composing annotated defect overlay and audit record' },
];

export const AnalysisStepper: React.FC<AnalysisStepperProps> = ({
  isAnalyzing,
  error = null
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(1);
      return;
    }

    // Progress through visual steps during backend analysis
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">AI Inspection Pipeline Active</h3>
            <p className="text-xs text-slate-400">Processing onion through computer-vision models</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
          Stage {currentStep} of 6
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 6) * 100}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const isDone = currentStep > stage.id;
          const isCurrent = currentStep === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isDone
                  ? 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                    {stage.id}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">{stage.title}</div>
                <div className="text-xs text-slate-400">{stage.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
