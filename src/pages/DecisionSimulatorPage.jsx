import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Zap,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { simulateDecisions, commitDecision, formatINR } from '../services/api';
import EconomicScoreBadge from '../components/EconomicScoreBadge';
import { buildRadarData, getRecommendedAction, priceScenarios } from '../services/scenarioPricing';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function DecisionSimulatorPage({ 
  orderId,
  order,
  disruption,
  onSelectActionForExplanation, 
  onExecuteDecision 
}) {
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [actionToCommit, setActionToCommit] = useState(null);
  const [backendScenarios, setBackendScenarios] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Dynamic sensitivity tuning sliders
  const [delayMultiplier, setDelayMultiplier] = useState(1.0);
  const [laborOvertimeRate, setLaborOvertimeRate] = useState(1.0);
  const [logisticsMultiplier, setLogisticsMultiplier] = useState(1.0);

  const scenario = {
    disruptionId: disruption?.id || 'No active disruption',
    orderId,
    orderTitle: `${order?.product || 'Production order'} for ${order?.customer || 'customer not recorded'}`,
    type: disruption?.type || 'Operational risk assessment',
    financialRiskIfNoActionINR: disruption?.financialRiskINR || 0,
    description: disruption?.description || 'No active disruption is linked to this order.',
    affectedMachine: order?.assignedMachine,
    delayAmountMinutes: order?.delay_minutes || 0,
  };

  // Try fetching backend counterfactual scenarios on mount
  useEffect(() => {
    async function loadScenarios() {
      setIsLoading(true);
      if (!orderId) {
        setBackendScenarios([]);
        setLoadError('Select a production order before running a simulation.');
        setIsLoading(false);
        return;
      }
      try {
        const res = await simulateDecisions(orderId);
        setBackendScenarios(res.scenarios);
        setSelectedActionId(res.scenarios[0]?.id || null);
        setLoadError('');
      } catch (error) {
        setLoadError(error.message);
        setBackendScenarios([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadScenarios();
  }, [orderId]);

  const sourceActions = backendScenarios || [];
  const computedActions = priceScenarios(sourceActions, {
    delayMultiplier,
    laborOvertimeRate,
    logisticsMultiplier,
  }, scenario.financialRiskIfNoActionINR);
  const recommendedAction = getRecommendedAction(computedActions);

  const handleOpenCommitModal = (action) => {
    setActionToCommit(action);
    setShowCommitModal(true);
  };

  const handleConfirmCommit = async () => {
    if (!actionToCommit) return;
    try {
      await commitDecision({
        order_id: orderId,
        chosen_action: actionToCommit.action || actionToCommit.id,
        predicted_cost: actionToCommit.dynamicTotalCost,
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (onExecuteDecision) await onExecuteDecision(actionToCommit);
      setShowCommitModal(false);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const radarData = buildRadarData(computedActions);

  // Bar chart cost comparison data
  const barChartData = computedActions.map(a => ({
    name: a.id || a.action,
    cost: a.dynamicTotalCost,
    formattedCost: a.formattedCost
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs uppercase font-bold">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Counterfactual Economic Decision Intelligence Engine</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-0.5">
            Production Decision Simulator
          </h1>
        </div>
        <button
          disabled={!recommendedAction}
          onClick={() => onSelectActionForExplanation(recommendedAction, scenario, computedActions, {
            delayMultiplier,
            laborOvertimeRate,
            logisticsMultiplier,
          })}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-teal-950/50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>View Recommendation Rationale</span>
        </button>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{loadError}</div>}
      {isLoading && <p className="text-sm text-slate-400">Simulating current order state…</p>}

      {/* Disruption Context Card */}
      <div className="p-6 rounded-3xl glass-panel border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                {scenario.type}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {scenario.disruptionId}</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mt-1">
              Order {scenario.orderId}: {scenario.orderTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {scenario.description} {scenario.affectedMachine ? `Current machine: ${scenario.affectedMachine}.` : ''}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Recorded Exposure if No Action</span>
            <div className="text-xl font-mono font-extrabold text-rose-400">{formatINR(scenario.financialRiskIfNoActionINR)}</div>
          </div>
        </div>

        {/* Dynamic Sensitivity Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Delay Penalty Weight</span>
              <span className="text-teal-400 font-bold">{delayMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={delayMultiplier}
              onChange={(e) => setDelayMultiplier(Number(e.target.value))}
              className="w-full accent-teal-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Labor Overtime Rate</span>
              <span className="text-indigo-400 font-bold">{laborOvertimeRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={laborOvertimeRate}
              onChange={(e) => setLaborOvertimeRate(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Logistics Cost Multiplier</span>
              <span className="text-emerald-400 font-bold">{logisticsMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={logisticsMultiplier}
              onChange={(e) => setLogisticsMultiplier(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4 Counterfactual Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Simulated Candidate Actions (Counterfactual Analysis)</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Sensitivity controls reprice actions; predicted action and delay stay fixed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {!isLoading && computedActions.length === 0 && (
            <p className="col-span-full rounded-xl border border-slate-800 p-5 text-sm text-slate-400">No simulation scenarios are available for this order.</p>
          )}
          {computedActions.map((action) => {
            const actionId = action.id || action.action;
            const isSelected = selectedActionId === actionId;
            const isRecommended = actionId === recommendedAction?.id;

            return (
              <div
                key={actionId}
                onClick={() => setSelectedActionId(actionId)}
                className={`p-5 rounded-2xl glass-panel cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  isRecommended 
                    ? 'border-emerald-500/60 bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950/30' 
                    : isSelected 
                    ? 'border-teal-500 bg-teal-950/20 ring-1 ring-teal-500' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{actionId}</span>
                    {isRecommended && (
                      <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        ✓ Optimal Choice
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-base text-white leading-snug">{action.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{action.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">Impact Score</span>
                    <EconomicScoreBadge score={action.dynamicImpactScore} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded-xl bg-slate-950/60">
                    <div>
                      <span className="text-slate-500 uppercase text-[9px]">Delay</span>
                      <p className={`font-bold ${action.delayMinutes > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {action.delayMinutes} mins
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px]">Total Cost</span>
                      <p className="font-bold text-white">{action.formattedCost}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCommitModal(action);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isRecommended 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Commit Decision</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counterfactual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Comparison Bar Chart */}
        <div className="p-6 rounded-3xl glass-panel space-y-4 border-slate-800">
          <h3 className="font-heading font-bold text-lg text-white">Expected Financial Impact Comparison (₹ INR)</h3>
          <p className="text-xs text-slate-400">Additive cost model projection across candidate scenarios.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                formatter={(value) => [formatINR(value), "Total Expected Cost"]}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`bar-${index}`} 
                      fill={entry.name === recommendedAction?.id ? '#10B981' : entry.name === 'WAIT' ? '#EF4444' : '#38BDF8'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Axis Radar Comparison Chart */}
        <div className="p-6 rounded-3xl glass-panel space-y-4 border-slate-800">
          <h3 className="font-heading font-bold text-lg text-white">Scenario Counterfactual Radar Axis</h3>
          <p className="text-xs text-slate-400">Weighted cost contribution by dimension, scaled against the highest-cost action.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={85} data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                {computedActions.map((action, index) => (
                  <Radar
                    key={action.id}
                    name={action.title}
                    dataKey={action.id}
                    stroke={['#EF4444', '#10B981', '#38BDF8', '#818CF8'][index % 4]}
                    fill={['#EF4444', '#10B981', '#38BDF8', '#818CF8'][index % 4]}
                    fillOpacity={0.15}
                  />
                ))}
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      {showCommitModal && actionToCommit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0D1527] border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-lg text-white">Confirm Decision Commit</h3>
              </div>
              <button 
                onClick={() => setShowCommitModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to authorize execution of decision: <strong className="text-teal-300">{actionToCommit.title}</strong> for Order {orderId}.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Predicted Cost:</span>
                <span className="text-white font-bold">{actionToCommit.formattedCost}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expected Delay:</span>
                <span className="text-emerald-400 font-bold">{actionToCommit.delayMinutes} mins</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Workstation:</span>
                <span className="text-sky-300 font-bold">M06 (Standby)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              ⚠️ Advisory Recommendation Notice: Execution will trigger immediate factory floor state mutation.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCommitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCommit}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Authorize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
