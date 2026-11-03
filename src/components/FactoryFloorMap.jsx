import React from 'react';
import { Cpu, AlertCircle, CheckCircle2, Clock, User, Gauge } from 'lucide-react';

export default function FactoryFloorMap({ machines, onSelectMachine, selectedMachineId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {machines.map((machine) => {
        const isSelected = selectedMachineId === machine.id;
        const isDelayed = machine.status === 'delayed';
        const isIdle = machine.status === 'idle';

        let statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        let statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
        let statusText = 'RUNNING';

        if (isDelayed) {
          statusBg = 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse';
          statusIcon = <AlertCircle className="w-3.5 h-3.5" />;
          statusText = 'DELAYED / AT RISK';
        } else if (isIdle) {
          statusBg = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
          statusIcon = <Clock className="w-3.5 h-3.5" />;
          statusText = 'STANDBY IDLE';
        }

        return (
          <div
            key={machine.id}
            onClick={() => onSelectMachine && onSelectMachine(machine.id)}
            className={`p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-sky-400 border-sky-500 bg-sky-950/20' : ''
            }`}
          >
            {/* Machine Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl bg-slate-900 border ${isDelayed ? 'border-rose-500/50 text-rose-400' : 'border-slate-800 text-sky-400'}`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-white">{machine.id}</div>
                  <div className="text-xs text-slate-400 font-medium truncate max-w-[140px]">{machine.name}</div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${statusBg}`}>
                {statusIcon}
                {statusText}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono">Current Order</span>
                <p className="font-mono font-semibold text-slate-200 mt-0.5">
                  {machine.currentOrder || <span className="text-slate-500 italic">None (Standby)</span>}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono">Efficiency</span>
                <div className="flex items-center gap-1 font-mono font-semibold text-slate-200 mt-0.5">
                  <Gauge className="w-3 h-3 text-sky-400" />
                  <span>{machine.efficiency}%</span>
                </div>
              </div>
            </div>

            {/* Operator & Material info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[120px]">{machine.operator}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">{machine.temperature}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
