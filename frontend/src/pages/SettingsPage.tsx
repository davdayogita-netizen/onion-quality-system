import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Cpu,
  Save,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Info,
  RefreshCw
} from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';
import { SettingsData } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updated = await updateSettings({
        inference_mode: settings.inference_mode,
        yolo_model_path: settings.yolo_model_path,
        classifier_model_path: settings.classifier_model_path,
        grade_a_min: Number(settings.grade_a_min),
        grade_b_min: Number(settings.grade_b_min),
        grade_c_min: Number(settings.grade_c_min),
        grade_d_min: Number(settings.grade_d_min),
        reject_max: Number(settings.reject_max),
      });
      setSettings(updated);
      setSuccessMessage('System configuration updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sliders className="w-7 h-7 text-emerald-400" />
          <span>Model & Grading Configuration</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust inference engines, PyTorch/YOLO model paths, and quality score grading thresholds.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Machine Learning & Inference Engine Mode */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Inference Engine Runtime</span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose between deterministic demo inference and production deep learning weights
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
              Active: {settings.inference_mode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Demo Mode Option */}
            <div
              onClick={() => setSettings({ ...settings, inference_mode: 'demo' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                settings.inference_mode === 'demo'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">Demo Inference Mode</span>
                {settings.inference_mode === 'demo' && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Uses deterministic OpenCV feature analysis and colorimetry. Zero external deep learning weights required. Perfect for SIH evaluation and testing.
              </p>
            </div>

            {/* Production Mode Option */}
            <div
              onClick={() => setSettings({ ...settings, inference_mode: 'production' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                settings.inference_mode === 'production'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">Production Model Weights</span>
                {settings.inference_mode === 'production' && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Loads custom PyTorch and YOLO `.pt` checkpoints directly from disk for real deep learning inference.
              </p>
            </div>
          </div>

          {/* Model Weights File Paths */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                YOLO Defect Model Path (.pt)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={settings.yolo_model_path}
                  onChange={(e) => setSettings({ ...settings, yolo_model_path: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                    settings.yolo_model_exists
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {settings.yolo_model_exists ? '✓ Model Found' : 'Demo Mode Active'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                PyTorch Classifier Model Path (.pt)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={settings.classifier_model_path}
                  onChange={(e) => setSettings({ ...settings, classifier_model_path: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono ${
                    settings.classifier_model_exists
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {settings.classifier_model_exists ? '✓ Model Found' : 'Demo Mode Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Configurable Quality Grading Engine Thresholds */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">Quality Grade Minimum Thresholds</h2>
            <p className="text-xs text-slate-400">
              Customize score cutoff boundaries for agricultural grading categories (0 - 100)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Grade A */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase">Grade A (Premium)</div>
              <div className="text-[11px] text-slate-500">Minimum Score</div>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.grade_a_min}
                onChange={(e) => setSettings({ ...settings, grade_a_min: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-emerald-400"
              />
            </div>

            {/* Grade B */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-blue-400 uppercase">Grade B (Commercial)</div>
              <div className="text-[11px] text-slate-500">Minimum Score</div>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.grade_b_min}
                onChange={(e) => setSettings({ ...settings, grade_b_min: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-blue-400"
              />
            </div>

            {/* Grade C */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase">Grade C (Processing)</div>
              <div className="text-[11px] text-slate-500">Minimum Score</div>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.grade_c_min}
                onChange={(e) => setSettings({ ...settings, grade_c_min: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-amber-400"
              />
            </div>

            {/* Grade D */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-orange-400 uppercase">Grade D (Substandard)</div>
              <div className="text-[11px] text-slate-500">Minimum Score</div>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.grade_d_min}
                onChange={(e) => setSettings({ ...settings, grade_d_min: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-orange-400"
              />
            </div>

            {/* Reject */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase">Reject / Discard</div>
              <div className="text-[11px] text-slate-500">Maximum Score</div>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.reject_max}
                onChange={(e) => setSettings({ ...settings, reject_max: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono font-bold text-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Form Notifications */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
