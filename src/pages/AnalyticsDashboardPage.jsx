import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, Activity, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchAnalytics, formatINR } from '../services/api';

const COLORS = ['#38BDF8', '#10B981', '#818CF8', '#F59E0B', '#EC4899', '#6366F1'];

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      setData(await fetchAnalytics());
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadAnalytics);
  }, []);

  const metrics = data?.metrics;
  const monthlyData = data?.monthly || [];
  const disruptionTypes = data?.disruptionTypes || [];
  const committedCount = metrics?.committedDecisions ?? 0;
  const averageError = metrics?.averagePredictionError;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Operational performance · live database</span>
          </div>
          <h1 className="mt-1 text-2xl font-heading font-bold text-white">Manufacturing Intelligence Analytics</h1>
        </div>
        <button onClick={loadAnalytics} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</div>}
      {isLoading && !data && <p className="text-sm text-slate-400">Loading analytics from saved outcomes…</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Committed Decisions" value={committedCount.toLocaleString('en-IN')} detail="Saved outcome records" />
        <Metric label="Average Prediction Error" value={averageError === null || averageError === undefined ? '—' : `${averageError}%`} detail="Across recorded outcomes" />
        <Metric label="Predicted Cost Total" value={formatINR(metrics?.totalPredictedCost || 0)} detail="Committed decisions" />
        <Metric label="Actual Cost Total" value={formatINR(metrics?.totalActualCost || 0)} detail={`${data?.disruptions || 0} recorded disruptions`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl glass-panel space-y-4 p-6">
          <h2 className="font-heading font-bold text-white">Monthly Decision Costs (₹ INR)</h2>
          {monthlyData.length === 0 ? <EmptyChartMessage /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                  <Bar dataKey="predictedCost" fill="#38BDF8" name="Predicted cost" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualCost" fill="#10B981" name="Actual cost" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-3xl glass-panel space-y-4 p-6">
          <h2 className="font-heading font-bold text-white">Recorded Disruption Types</h2>
          {disruptionTypes.length === 0 ? <EmptyChartMessage /> : (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={disruptionTypes} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78}>
                      {disruptionTypes.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {disruptionTypes.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <strong className="font-mono text-white">{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {monthlyData.length > 1 && (
        <section className="rounded-3xl glass-panel space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-heading font-bold text-white"><Activity className="h-4 w-4 text-teal-400" /> Decision Cost Trend</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="predictedCost" stroke="#38BDF8" strokeWidth={2} name="Predicted" />
                <Line type="monotone" dataKey="actualCost" stroke="#10B981" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
      <p className="flex items-center gap-2 text-[11px] text-slate-500"><Clock className="h-3.5 w-3.5" /> Analytics are calculated from committed outcomes and disruption records in the database.</p>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-2xl glass-panel space-y-1 p-4">
      <span className="text-[10px] font-mono uppercase text-slate-400">{label}</span>
      <div className="break-words text-xl font-extrabold font-mono text-white">{value}</div>
      <p className="text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

function EmptyChartMessage() {
  return <div className="flex h-56 items-center justify-center text-sm text-slate-500">No matching records are available yet.</div>;
}
