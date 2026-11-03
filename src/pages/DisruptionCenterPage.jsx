import React, { useMemo, useState } from 'react';
import { 
  Clock, 
  Cpu, 
  ArrowRight, 
  Zap, 
  ShieldAlert, 
  Activity
} from 'lucide-react';
import { formatINR } from '../services/api';

export default function DisruptionCenterPage({ disruptions, orders, machines, onSimulateDisruption }) {
  const [selectedType, setSelectedType] = useState('All test cases');
  const caseTypes = useMemo(
    () => ['All test cases', ...new Set(disruptions.map((event) => event.type))],
    [disruptions],
  );
  const activeDisruptions = disruptions.map((event) => {
    const order = orders.find((item) => item.id === event.affected_order_id);
    const qualifiedStandby = machines.find((machine) =>
      machine.status === 'idle'
      && machine.material_needed?.trim().toLowerCase() === order?.material?.trim().toLowerCase()
    );
    return {
      ...event,
      title: `${event.type} affecting order ${event.affected_order_id}`,
      affectedOrder: event.affected_order_id,
      orderTitle: order?.product || event.description,
      affectedMachine: order?.assignedMachine || "Not assigned",
      standbyMachine: qualifiedStandby?.id || "No qualified idle machine",
      financialRiskINR: event.financial_risk_inr,
      rootCause: event.root_cause || "Not recorded",
      status: "ACTIVE",
    };
  });
  const visibleDisruptions = selectedType === 'All test cases'
    ? activeDisruptions
    : activeDisruptions.filter((event) => event.type === selectedType);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Synthetic Disruption Test Case Library</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-0.5">
            Explore Demo Test Cases
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pick a seeded case to see how the recommendation changes across material, equipment, quality, and supplier events.
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl glass-panel p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-bold text-white">Choose a test case</h2>
            <p className="text-[11px] text-slate-400">These are synthetic examples from the local demo database, not live factory alerts.</p>
          </div>
          <span className="font-mono text-[10px] text-slate-500">{disruptions.length} cases loaded</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {caseTypes.map((type) => {
            const count = type === 'All test cases'
              ? disruptions.length
              : disruptions.filter((event) => event.type === type).length;
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'border-teal-400 bg-teal-500/15 text-teal-200'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                {type} <span className="ml-1 font-mono text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Test Case Cards */}
      <div className="space-y-4">
        {visibleDisruptions.length === 0 && (
          <div className="p-6 rounded-2xl glass-panel text-sm text-slate-400">
            {disruptions.length === 0
              ? 'No synthetic disruption cases are loaded. Start the backend and seed the demo database.'
              : 'No cases match this filter.'}
          </div>
        )}
        {visibleDisruptions.map((disruption) => (
          <div 
            key={disruption.id}
            className="p-6 rounded-3xl glass-panel border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 space-y-4 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                    SEVERITY: {disruption.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {disruption.id}</span>
                </div>
                <h2 className="text-xl font-heading font-bold text-white mt-1">
                  {disruption.title}
                </h2>
                <p className="text-xs text-slate-300">
                  Affected Order: <strong className="text-white">{disruption.affectedOrder}</strong> — {disruption.orderTitle}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Unmitigated Exposure Risk</span>
                <div className="text-xl font-mono font-extrabold text-rose-400">{formatINR(disruption.financialRiskINR)}</div>
                <span className="text-[10px] text-slate-500 font-mono">If no action taken</span>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[9px]">Affected Workstation</span>
                <p className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{disruption.affectedMachine}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[9px]">Standby Counterfactual Machine</span>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{disruption.standbyMachine}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[9px]">Root Cause Context</span>
                <p className="font-bold text-slate-300 truncate">
                  {disruption.rootCause}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recorded (IST): <strong className="text-amber-300 font-mono">
                  {new Date(disruption.start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </strong></span>
              </div>

              <button
                onClick={() => onSimulateDisruption(disruption)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Simulate Decisions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
