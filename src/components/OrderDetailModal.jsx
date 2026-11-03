import React from 'react';
import { 
  X, 
  Clock, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatINR } from '../services/api';

export default function OrderDetailModal({ order, machine, disruption, onClose, onSimulate }) {
  if (!order) return null;

  const isAtRisk = order.delayRiskScore >= 50 || order.status.includes('RISK');
  const deadlineLabel = order.deadline && !Number.isNaN(Date.parse(order.deadline))
    ? new Date(order.deadline).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : order.deadline || 'Not recorded';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0D1527] border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                PRODUCTION ORDER DETAIL
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {order.id}</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mt-1">{order.product}</h2>
            <p className="text-xs text-slate-400">Customer: <strong className="text-slate-200">{order.customer}</strong></p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Key Information Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Quantity</span>
            <p className="font-mono font-bold text-white text-sm">{order.completedQuantity} / {order.quantity} units</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Delivery Deadline</span>
            <p className="font-mono font-bold text-teal-400 text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{deadlineLabel} IST</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned Machine</span>
            <p className="font-mono font-bold text-sky-400 text-sm flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>{order.assignedMachine}</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Level</span>
            <p className={`font-mono font-bold text-sm ${isAtRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
              {order.delayRiskScore || 10}% ({isAtRisk ? 'CRITICAL' : 'LOW'})
            </p>
          </div>
        </div>

        {/* Requirements & Tooling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Material & Tooling */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-mono font-bold text-slate-300 uppercase text-[10px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Material & Tooling Setup</span>
            </h4>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Required Material:</span>
                <span className="font-semibold text-white">{order.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tooling Mapping:</span>
                <span className="font-semibold text-teal-300">{order.tooling || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity Allocation:</span>
                <span className="font-semibold text-sky-300">{machine?.maxCapacityUnitsHr || machine?.max_capacity_units_hr || 'Not recorded'} units / hr</span>
              </div>
            </div>
          </div>

          {/* Active Blockers */}
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
            isAtRisk ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <h4 className="font-mono font-bold uppercase text-[10px] flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${isAtRisk ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span>Active Blockers & Status</span>
            </h4>
            <p className="text-xs leading-relaxed">
              {disruption?.description || order.blockers || 'No active disruption is linked to this order.'}
            </p>
            {isAtRisk && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] font-mono text-rose-300 font-semibold">
                Financial Risk Exposure: {formatINR(disruption?.financial_risk_inr || 0)} if unresolved.
              </div>
            )}
          </div>
        </div>

        {/* Evidence Panel */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <h4 className="font-mono font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Counterfactual Readiness Evidence</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Machine {machine?.id || order.assignedMachine} · {machine?.status || 'state unavailable'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Material requirement: {order.material || 'Not recorded'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Reported risk score: {order.delayRiskScore ?? 0}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Operator: {machine?.operator || 'Not recorded'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          {isAtRisk && (
            <button
              onClick={() => {
                onClose();
                if (onSimulate) onSimulate(order.id);
              }}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Simulate Counterfactual Decisions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
