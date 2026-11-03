import React, { useState } from 'react';
import { 
  Cpu, 
  Package, 
  AlertTriangle, 
  Activity, 
  ShieldAlert,
  Zap,
} from 'lucide-react';
import FactoryFloorMap from '../components/FactoryFloorMap';
import OrderDetailModal from '../components/OrderDetailModal';
import { formatINR } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function FactoryOverviewPage({ machines, orders, rawMaterials, disruptions, onSimulateOrder }) {
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

  const activeOrdersCount = orders.length;
  const runningMachinesCount = machines.filter(m => m.status === 'running').length;
  const ordersAtRisk = orders.filter(o => o.delay_risk_score >= 50 || o.status.includes('RISK')).length;
  const activeDisruptionsCount = disruptions.length;
  const totalRiskExposureINR = disruptions.reduce((total, disruption) => total + disruption.financial_risk_inr, 0);
  const primaryDisruption = disruptions[0];
  const primaryDisruptionOrder = orders.find((order) => order.id === primaryDisruption?.affected_order_id);
  const firstAtRiskOrder = orders.find((order) => order.delay_risk_score >= 50) || orders[0];

  // Machine efficiency telemetry data
  const machineData = machines.map(m => ({
    name: m.id,
    efficiency: m.efficiency,
    status: m.status
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Synthetic Factory Demo State</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mt-0.5">
            REALRUN Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Exploring sample production orders, machine availability, and counterfactual decision scenarios.
          </p>
        </div>
        <button
          onClick={() => firstAtRiskOrder && onSimulateOrder(firstAtRiskOrder.id)}
          disabled={!firstAtRiskOrder}
          className="px-4 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Simulate Highest-Risk Order</span>
        </button>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl glass-panel space-y-1 border-teal-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Orders</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{activeOrdersCount}</div>
          <p className="text-[10px] text-slate-500 font-mono">Loaded from factory database</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Machines</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">{runningMachinesCount} / {machines.length}</div>
          <p className="text-[10px] text-slate-500 font-mono">{machines.filter(m => m.status === 'idle').length} idle / standby</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span>Orders At Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">{ordersAtRisk}</div>
          <p className="text-[10px] text-rose-300 font-mono">Risk score ≥ 50</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Disruptions</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">{activeDisruptionsCount}</div>
          <p className="text-[10px] text-slate-500 font-mono">From active event records</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel space-y-1 border-indigo-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Risk Exposure (₹)</span>
            <span className="font-mono text-indigo-400 font-bold">INR</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-indigo-300">{formatINR(totalRiskExposureINR)}</div>
          <p className="text-[10px] text-slate-500 font-mono">If no action taken</p>
        </div>
      </div>

      {primaryDisruption && (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-white text-sm">
                Active Disruption: Order {primaryDisruption.affected_order_id}
                {primaryDisruptionOrder ? ` · ${primaryDisruptionOrder.product}` : ''}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold">
                {primaryDisruption.type} · {primaryDisruption.severity}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {primaryDisruption.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => onSimulateOrder(primaryDisruption.affected_order_id)}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate Counterfactual Decisions</span>
        </button>
      </div>
      )}

      {/* Factory Floor Workstation Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>Machine Workstations ({machines.length})</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Click any workstation to inspect current state</span>
        </div>
        <FactoryFloorMap machines={machines} onSelectMachine={(id) => {
          const order = orders.find((item) => item.assignedMachine === id);
          if (order) onSimulateOrder(order.id);
        }} />
      </div>

      {/* Analytics & Orders Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Telemetry Chart */}
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <h3 className="font-heading font-bold text-base text-white">Machine Telemetry Efficiency (%)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="efficiency" radius={[6, 6, 0, 0]}>
                  {machineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'delayed' ? '#EF4444' : entry.status === 'idle' ? '#38BDF8' : '#10B981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheduled Orders List */}
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-white">Scheduled Production Orders</h3>
            <span className="text-[11px] font-mono text-slate-400">Click order for full details</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
            {orders.map((order) => {
              const isAtRisk = order.status.includes('RISK');
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrderForModal(order)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer hover:border-teal-500/50 ${
                    isAtRisk ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono font-bold text-white">
                      <span>{order.id}</span>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">({order.customer})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{order.product}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isAtRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Assigned: {order.assignedMachine}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="rounded-2xl glass-panel space-y-3 p-5">
        <h3 className="font-heading font-bold text-base text-white">Raw Material Status</h3>
        {rawMaterials.length === 0 ? (
          <p className="text-xs text-slate-400">No material records are available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rawMaterials.map((material) => (
              <div key={material.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-white">{material.name}</strong>
                  <span className="font-mono text-slate-400">{material.stock}</span>
                </div>
                <p className={`mt-1 ${material.status.toLowerCase().includes('sufficient') ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {material.status}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">Affected order: {material.affectedOrder || 'Not specified'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Order Detail Modal */}
      {selectedOrderForModal && (
        <OrderDetailModal
          order={selectedOrderForModal}
          machine={machines.find((item) => item.id === selectedOrderForModal.assignedMachine)}
          disruption={disruptions.find((item) => item.affected_order_id === selectedOrderForModal.id)}
          onClose={() => setSelectedOrderForModal(null)}
          onSimulate={(orderId) => onSimulateOrder(orderId)}
        />
      )}
    </div>
  );
}
