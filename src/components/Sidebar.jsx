import React from 'react';
import { 
  Home, 
  LayoutDashboard, 
  AlertTriangle, 
  Sliders, 
  BrainCircuit, 
  RotateCcw, 
  BarChart3,
  Flame,
  Award
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentOrder, currentDisruption }) {
  const menuItems = [
    { id: 'overview', label: '1. Factory Overview', icon: LayoutDashboard },
    { id: 'disruptions', label: '2. Disruption Center', icon: AlertTriangle, badge: 'Live' },
    { id: 'simulator', label: '3. Decision Simulator', icon: Sliders, highlight: true },
    { id: 'explanation', label: '4. AI Explanation', icon: BrainCircuit },
    { id: 'feedback', label: '5. Outcome History', icon: RotateCcw },
    { id: 'analytics', label: '6. ROI Analytics', icon: BarChart3 },
    { id: 'landing', label: 'Project Concept', icon: Home },
  ];

  return (
    <aside className="w-64 bg-[#0B1120] border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider mb-2">
            REALRUN Modules
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold shadow-lg shadow-teal-950/50'
                      : item.highlight
                      ? 'text-amber-300 hover:bg-slate-800/70 border border-amber-500/20 bg-amber-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Hackathon Alignment Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 font-heading font-semibold text-xs">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>India-Japan Hackathon 2026</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            Counterfactual Economic Decision Layer evaluating alternative actions in Indian Rupees (₹).
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono font-medium">
            <Flame className="w-3 h-3" />
            <span>Kaizen Lean Optimization</span>
          </div>
        </div>
      </div>

      {/* Current order context */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-500 uppercase">Current Order</div>
        <div className="text-xs font-semibold text-white font-mono mt-0.5">
          {currentOrder ? `${currentOrder.id} (${currentOrder.product})` : 'No order selected'}
        </div>
        <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
          {currentDisruption ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>{currentDisruption.type}</span>
            </>
          ) : <span className="text-slate-500">No active disruption</span>}
        </div>
      </div>
    </aside>
  );
}
