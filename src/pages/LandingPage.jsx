import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sliders, 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Award,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { formatINR } from '../services/api';

export default function LandingPage({ onStartSimulation, onNavigate, orders, machines, disruptions }) {
  const [annualDisruptions, setAnnualDisruptions] = useState(120);
  const averageRisk = disruptions.length
    ? Math.round(disruptions.reduce((sum, event) => sum + event.financial_risk_inr, 0) / disruptions.length)
    : 0;
  const [avgCostPerDisruption, setAvgCostPerDisruption] = useState(null);
  const costPerDisruption = avgCostPerDisruption ?? averageRisk;

  const estimatedLossWithoutAI = annualDisruptions * costPerDisruption;
  const estimatedSavings = Math.round(estimatedLossWithoutAI * 0.38); // 38% waste reduction via counterfactual decisions

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0D1527] to-[#0B1120] border border-slate-800 p-8 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* India manufacturing context */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Indian Manufacturing · Industry 4.0 & Kaizen</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-white leading-tight">
            Manufacturing Decisions <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Powered by Intelligence
            </span>
          </h1>

          <p className="text-lg text-slate-300 font-light leading-relaxed">
            <strong className="text-white font-semibold font-mono">"When production reality changes, know the best decision before you make it."</strong><br />
            REALRUN simulates counterfactual floor actions, evaluates downstream economic impact, and guides shop managers to the optimal response in real time.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onStartSimulation}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start Decision Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('overview')}
              className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>View Factory Floor</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Highlights */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Average Waste Reduction</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">{orders.length}</div>
            <p className="text-[10px] text-slate-500">Production orders in the database</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Decision Simulation Time</span>
            <div className="text-2xl font-extrabold font-mono text-sky-400">{machines.length}</div>
            <p className="text-[10px] text-slate-500">Machines reporting state</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Delivery SLA Protection</span>
            <div className="text-2xl font-extrabold font-mono text-indigo-400">{disruptions.length}</div>
            <p className="text-[10px] text-slate-500">Recorded disruption events</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Prediction Accuracy</span>
            <div className="text-2xl font-extrabold font-mono text-amber-400">
              {formatINR(disruptions.reduce((sum, event) => sum + event.financial_risk_inr, 0))}
            </div>
            <p className="text-[10px] text-slate-500">Recorded exposure (INR)</p>
          </div>
        </div>
      </section>

      {/* Core Innovation & Problem-Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel space-y-4 border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center gap-2 text-rose-400 font-heading font-bold text-lg">
            <AlertTriangle className="w-5 h-5" />
            <span>The Traditional Manufacturing Bottleneck</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Existing MES & ERP dashboards only report: <em className="text-slate-100 font-medium">"What went wrong?"</em> 
            When material delays or machine breakdowns happen, supervisors guess blindly between overtime, re-sequencing, or waiting—leading to high idle costs and delayed shipments.
          </p>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Unpredictable overtime costs & operator burnout
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Idle high-cost CNC machinery
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Escalating customer delay penalties
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl glass-panel space-y-4 border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center gap-2 text-emerald-400 font-heading font-bold text-lg">
            <ShieldCheck className="w-5 h-5" />
            <span>The REALRUN Intelligence Layer</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            REALRUN answers: <em className="text-emerald-300 font-medium">"What should we do next, and what will each action cost?"</em>
            It simulates every possible counterfactual candidate action in seconds, scores them on an Economic Impact scale (0-100), and provides explainable AI recommendations.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Counterfactual simulation of candidate actions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Comprehensive Economic Impact Score (0–100)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Explainable AI decision summaries powered by Gemini
            </li>
          </ul>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-heading font-bold text-white">Platform Capabilities</h2>
          <p className="text-xs text-slate-400">Built for plant managers, industrial engineers, and operational leaders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel glass-panel-hover space-y-3">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 w-fit">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-base text-white">1. Counterfactual Simulator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate candidate floor decisions (Wait, Move Machine, Expedite, Resequence) side-by-side.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel glass-panel-hover space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-base text-white">2. Economic Impact Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quantifies idle costs, setup times, overtime rates, and delivery penalty risks into a 0-100 score.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel glass-panel-hover space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-base text-white">3. Explainable AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clear natural language explanations explaining why an action was chosen over alternatives.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel glass-panel-hover space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-base text-white">4. Kaizen Learning Loop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compares predicted floor outcomes against actual executed results to continuously tune future accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section className="p-6 rounded-3xl glass-panel border-sky-500/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-heading font-bold text-lg">
              <DollarSign className="w-5 h-5" />
              <span>Interactive Operational ROI Estimator</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Illustrative estimate using your inputs and a 38% avoidable-cost assumption; not measured plant savings.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Annual Savings</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              {formatINR(estimatedSavings)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>Annual Production Disruptions</span>
                <span className="text-sky-400 font-bold">{annualDisruptions} incidents</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                value={annualDisruptions}
                onChange={(e) => setAnnualDisruptions(Number(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>Average Downtime Cost per Incident</span>
                <span className="text-emerald-400 font-bold">{formatINR(avgCostPerDisruption)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000000"
                step="10000"
                value={costPerDisruption}
                onChange={(e) => setAvgCostPerDisruption(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between text-xs space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Loss without Intelligence:</span>
              <span className="font-mono text-rose-400 font-semibold">{formatINR(estimatedLossWithoutAI)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost with REALRUN Rerouting:</span>
              <span className="font-mono text-emerald-400 font-semibold">{formatINR(estimatedLossWithoutAI - estimatedSavings)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
              <span className="text-white">Net Kaizen Economic Savings:</span>
              <span className="font-mono text-emerald-400">{formatINR(estimatedSavings)} / year</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-900/40 to-slate-900 border border-sky-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-white">Ready to test a real disruption scenario?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Run a counterfactual simulation using the current highest-risk order and factory data.
          </p>
        </div>
        <button
          onClick={onStartSimulation}
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/30 whitespace-nowrap cursor-pointer"
        >
          Launch Decision Simulator Now
        </button>
      </div>
    </div>
  );
}
