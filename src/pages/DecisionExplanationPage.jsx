import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw
} from 'lucide-react';
import { getRecommendationAndExplanation, formatINR } from '../services/api';

export default function DecisionExplanationPage({ 
  apiKey,
  orderId,
  order,
  adjustedRecommendation,
  onNavigateToFeedback 
}) {
  const [recommendationData, setRecommendationData] = useState(null);
  const [explanationData, setExplanationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedOrderId, setLoadedOrderId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (adjustedRecommendation || !orderId) {
      return () => {
        active = false;
      };
    }

    getRecommendationAndExplanation(orderId, apiKey)
      .then((res) => {
        if (!active) return;
        setRecommendationData(res.recommendation);
        setExplanationData(res.explanation);
        setError('');
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) {
          setLoadedOrderId(orderId);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [adjustedRecommendation, apiKey, orderId]);

  const rec = adjustedRecommendation?.recommendation || recommendationData;
  const brief = adjustedRecommendation?.explanation || explanationData;
  const isRecommendationLoading = isLoading || loadedOrderId !== orderId;
  const costRows = [
    ['Direct delay cost', 'Delay minutes × configured INR/min rate', 'delay_cost'],
    ['Overtime cost', 'Overtime hours × configured INR/hour rate', 'overtime_cost'],
    ['Setup / movement', 'Machine setup estimate', 'setup_cost'],
    ['Logistics', 'Transport estimate', 'logistics_cost'],
    ['Production loss', 'Estimated production loss', 'production_loss_cost'],
    ['Delivery exposure', 'Estimated delivery risk', 'delivery_exposure_cost'],
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase font-bold">
            <BrainCircuit className="w-4 h-4 text-teal-400" />
            <span>Explainable Counterfactual Recommendation Intelligence</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-0.5">
            Recommendation & Model Explanation Brief
          </h1>
        </div>
        <button
          onClick={onNavigateToFeedback}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>View Outcome History & Kaizen Logs</span>
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</div>}
      {!orderId && <div className="text-sm text-slate-400">Select a production order before requesting a recommendation.</div>}
      {isRecommendationLoading && !adjustedRecommendation && orderId && <p className="text-sm text-slate-400">Calculating a recommendation from current factory data…</p>}
      {(!isLoading || !orderId) && !rec && <div className="text-sm text-slate-400">Recommendation data is unavailable.</div>}

      {rec && <>
      {/* Advisory Banner Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-white text-sm">Advisory Recommendation Notice</span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-bold">
                RISK: {rec.risk_level}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              This recommendation is <strong>ADVISORY</strong>. Final execution requires supervisor authorization.
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 uppercase text-[10px]">Net Economic Savings</span>
          <div className="text-lg font-bold text-emerald-400">{rec.formatted_net_savings_inr || formatINR(rec.net_savings_inr)}</div>
        </div>
      </div>

      {/* Recommended Action Summary Card */}
      <div className="p-6 rounded-3xl glass-panel border-emerald-500/40 bg-emerald-950/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
              RECOMMENDED OPTIMAL ACTION
            </span>
            <h2 className="text-xl font-heading font-bold text-white mt-1">
              {rec.recommended_action_title || rec.recommended_action}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Order {orderId} ({order?.product || 'product not recorded'}) — {order?.assignedMachine || 'machine not assigned'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Predicted Impact</span>
            <div className="text-xl font-mono font-extrabold text-emerald-400">{formatINR(rec.predicted_impact_inr)}</div>
            <span className="text-[10px] text-slate-400 font-mono">Delay: {rec.predicted_delay_minutes} mins</span>
          </div>
        </div>

        {/* Natural Language Brief Section */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Executive Operational Brief ({brief?.source || 'REALRUN Kaizen Engine'})</span>
            </h3>
            {brief?.is_fallback && (
              <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                Offline Deterministic Fallback Active
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
            {brief?.explanation_text || 'No explanation was returned by the backend.'}
          </div>
        </div>

        {/* Core Evidence Checklist & Uncertainty Flags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Operational Reasons */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-mono font-bold text-teal-400 uppercase text-[10px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Key Decision Rationale</span>
            </h4>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {(rec.top_reasons || []).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Uncertainty & Assumptions */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-mono font-bold text-amber-400 uppercase text-[10px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Uncertainty & Operational Assumptions</span>
            </h4>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {(rec.uncertainty_flags || []).map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Itemized INR Cost Breakdown Table */}
      <div className="p-6 rounded-3xl glass-panel space-y-4 border-slate-800">
        <h3 className="font-heading font-bold text-lg text-white">Additive Cost Model Itemized Breakdown (₹ INR)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Cost Category</th>
                <th className="p-3">Formula Basis</th>
                <th className="p-3 text-right">Calculated Impact (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {costRows.map(([label, basis, key]) => (
                <tr key={key}>
                  <td className="p-3 font-semibold text-white">{label}</td>
                  <td className="p-3 text-slate-400">{basis}</td>
                  <td className="p-3 text-right font-bold text-white">{formatINR(rec.cost_breakdown?.[key] || 0)}</td>
                </tr>
              ))}
              <tr className="bg-slate-950/80 font-bold text-white">
                <td className="p-3 text-teal-400">Total Expected Economic Cost</td>
                <td className="p-3 text-slate-400">Additive Sum</td>
                <td className="p-3 text-right text-teal-300 text-sm">{formatINR(rec.predicted_impact_inr)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </>}
    </div>
  );
}
