import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  AlertTriangle, 
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { resetDemoData } from '../services/api';

export default function Navbar({ setActiveTab, apiKey, setApiKey, activeDisruptionsCount, apiOnline, onResetDemo }) {
  const [timeStr, setTimeStr] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setShowKeyInput(false);
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset the demo database to its original synthetic sample data? This permanently deletes saved decisions and any other records in this database.',
    );
    if (!confirmed) return;

    setIsResetting(true);
    setResetError('');
    try {
      await resetDemoData();
      if (onResetDemo && await onResetDemo() === false) {
        setResetError('The reset completed, but the latest factory data could not be loaded.');
      }
    } catch (error) {
      setResetError(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('landing')} 
          className="flex items-center gap-3 group text-left transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-sky-600 to-indigo-500 p-[2px] shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-teal-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">REALRUN</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold uppercase tracking-wider">
                India-Japan 2026
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold uppercase">
                {apiOnline ? 'API Connected · INR' : 'API Offline · INR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">Counterfactual Economic Decision Intelligence for Manufacturing</p>
          </div>
        </button>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>INDIA TIME:</span>
          <span className="text-teal-400 font-bold">{timeStr}</span>
        </div>

        {/* Active Disruptions Quick Badge */}
        <button
          onClick={() => setActiveTab('disruptions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeDisruptionsCount > 0 
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 animate-pulse'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeDisruptionsCount} Disruption{activeDisruptionsCount === 1 ? '' : 's'}</span>
        </button>
        {resetError && (
          <span role="alert" className="absolute right-4 top-16 max-w-sm rounded-lg border border-rose-500/40 bg-rose-950 p-2 text-[11px] text-rose-200">
            Reset failed: {resetError}
          </span>
        )}

        {/* Reset Demo Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
          title="Reset factory state to initial seed scenario"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* Gemini API Key Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              apiKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
            title="Configure optional Gemini API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{apiKey ? 'Gemini Active' : 'Gemini Key'}</span>
          </button>

          {showKeyInput && (
            <div className="absolute right-0 top-11 w-80 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white">
                <Key className="w-4 h-4 text-teal-400" />
                <span>Configure Gemini API Key</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Optional: Enter Gemini API key to enable live LLM explanations. (Offline Kaizen fallback engine active by default).
              </p>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono mb-3"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Health Indicator */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-xs font-medium text-slate-300">{apiOnline ? 'Factory Online' : 'API Offline'}</span>
        </div>
      </div>
    </header>
  );
}
