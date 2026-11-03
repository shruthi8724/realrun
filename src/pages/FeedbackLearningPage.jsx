import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw
} from 'lucide-react';
import { fetchHistory, resetDemoData, formatINR } from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function FeedbackLearningPage({ onResetDemo }) {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      setHistoryLogs(await fetchHistory('all'));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadHistory);
  }, []);

  const handleReset = async () => {
    try {
      await resetDemoData();
      await loadHistory();
      if (onResetDemo && await onResetDemo() === false) {
        setError('Database reset completed, but factory data could not be refreshed.');
      }
    } catch (resetError) {
      setError(resetError.message);
    }
  };

  // Trend chart data
  const trendData = historyLogs.map(log => ({
    time: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—',
    predicted: log.predicted_cost,
    actual: log.actual_cost,
    error: log.prediction_error
  })).reverse();

  // Average prediction error
  const avgError = historyLogs.length > 0 
    ? (historyLogs.reduce((acc, log) => acc + log.prediction_error, 0) / historyLogs.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase font-bold">
            <RotateCcw className="w-4 h-4 text-teal-400" />
            <span>Closed-Loop Outcome Intelligence & Kaizen Learning</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-0.5">
            Outcome History & Prediction Accuracy Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing predicted vs actual decision costs to refine model precision over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {/* Accuracy Summary Cards */}
      {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</div>}
      {isLoading && <p className="text-xs text-slate-400">Loading saved outcomes…</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel space-y-1 border-teal-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Committed Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{historyLogs.length}</div>
          <p className="text-[10px] text-slate-500 font-mono">Saved decision records</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mean Absolute Prediction Error</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">{avgError}%</div>
          <p className="text-[10px] text-emerald-300 font-mono">Calculated from recorded outcomes</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-indigo-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Actual Cost</span>
            <span className="font-mono text-indigo-400 font-bold">INR</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-indigo-300">
            {formatINR(historyLogs.reduce((sum, log) => sum + log.actual_cost, 0))}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Sum of saved actual costs</p>
        </div>
      </div>

      {/* Prediction Accuracy Trend Chart */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 border-slate-800">
        <h3 className="font-heading font-bold text-lg text-white">Predicted vs Actual Financial Impact Trend (₹ INR)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => [formatINR(value), "Cost"]}
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="predicted" stroke="#38BDF8" strokeWidth={2} name="Predicted Impact" />
              <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual Outcome" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Outcome Log Table */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 border-slate-800">
        <h3 className="font-heading font-bold text-lg text-white">Historical Outcome Verification Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Chosen Action</th>
                <th className="p-3 text-right">Predicted (₹)</th>
                <th className="p-3 text-right">Actual (₹)</th>
                <th className="p-3 text-right">Error %</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {historyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-bold text-teal-400">{log.id}</td>
                  <td className="p-3 font-semibold text-white">{log.order_id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {log.chosen_action}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-sky-400">{formatINR(log.predicted_cost)}</td>
                  <td className="p-3 text-right font-bold text-emerald-400">{formatINR(log.actual_cost)}</td>
                  <td className="p-3 text-right text-slate-300">{log.prediction_error}%</td>
                  <td className="p-3 text-right text-slate-500 text-[11px]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
