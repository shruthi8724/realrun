import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import FactoryOverviewPage from './pages/FactoryOverviewPage';
import DisruptionCenterPage from './pages/DisruptionCenterPage';
import DecisionSimulatorPage from './pages/DecisionSimulatorPage';
import DecisionExplanationPage from './pages/DecisionExplanationPage';
import FeedbackLearningPage from './pages/FeedbackLearningPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import {
  fetchOrders,
  fetchMachines,
  fetchMaterials,
  fetchDisruptions,
  formatINR,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [machines, setMachines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedDisruption, setSelectedDisruption] = useState(null);
  const [adjustedRecommendation, setAdjustedRecommendation] = useState(null);
  const [executedToast, setExecutedToast] = useState(null);

  const loadFactoryData = useCallback(async () => {
    try {
      const [apiOrders, apiMachines, apiMaterials, apiDisruptions] = await Promise.all([
        fetchOrders(),
        fetchMachines(),
        fetchMaterials(),
        fetchDisruptions(),
      ]);
      setOrders(apiOrders.map((order) => ({
        ...order,
        completedQuantity: order.completed_quantity,
        assignedMachine: order.current_machine,
        material: order.material_name,
        deadline: order.due_at,
        delayRiskScore: order.delay_risk_score,
        delayMinutes: order.delay_minutes,
      })));
      setMachines(apiMachines.map((machine) => ({
        ...machine,
        currentOrder: machine.current_order,
        maxCapacityUnitsHr: machine.max_capacity_units_hr,
        hourlyOperatingCostINR: machine.hourly_operating_cost,
      })));
      setRawMaterials(apiMaterials.map((material) => ({
        ...material,
        affectedOrder: material.affected_order_id,
      })));
      setDisruptions(apiDisruptions);
      setApiError('');
      return true;
    } catch (error) {
      setApiError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadFactoryData);
    const intervalId = setInterval(loadFactoryData, 30000);
    return () => clearInterval(intervalId);
  }, [loadFactoryData]);

  const activeDisruption = disruptions[0] || null;
  const currentOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];

  const selectDisruptionForSimulation = (disruption) => {
    const orderId = disruption.affected_order_id || disruption.affectedOrder || disruption.orderId;
    setSelectedOrderId(orderId);
    setAdjustedRecommendation(null);
    setSelectedDisruption({
      ...disruption,
      orderId,
      orderTitle: orders.find((order) => order.id === orderId)?.product,
      affectedMachine: orders.find((order) => order.id === orderId)?.assignedMachine,
      financialRiskINR: disruption.financial_risk_inr ?? disruption.financialRiskINR,
      delayAmountMinutes: orders.find((order) => order.id === orderId)?.delay_minutes,
    });
    setActiveTab('simulator');
  };

  const handleStartSimulation = () => {
    if (activeDisruption) {
      selectDisruptionForSimulation(activeDisruption);
      return;
    }
    const atRiskOrder = orders.find((order) => order.delay_risk_score > 50) || orders[0];
    if (atRiskOrder) {
      setSelectedOrderId(atRiskOrder.id);
      setSelectedDisruption(null);
      setAdjustedRecommendation(null);
      setActiveTab('simulator');
    }
  };

  const handleSelectDisruptionFromCenter = (disruption) => {
    selectDisruptionForSimulation(disruption);
  };

  const handleSelectOrderForSimulation = (orderId) => {
    setSelectedOrderId(orderId);
    setAdjustedRecommendation(null);
    const disruption = disruptions.find((event) => event.affected_order_id === orderId);
    setSelectedDisruption(disruption ? {
      ...disruption,
      orderId,
      orderTitle: orders.find((order) => order.id === orderId)?.product,
      affectedMachine: orders.find((order) => order.id === orderId)?.assignedMachine,
      financialRiskINR: disruption.financial_risk_inr,
      delayAmountMinutes: orders.find((order) => order.id === orderId)?.delay_minutes,
    } : null);
    setActiveTab('simulator');
  };

  const handleSelectActionForExplanation = (action, scenario, candidates, sensitivity) => {
    const waitAction = candidates.find((candidate) => candidate.action === 'WAIT');
    const netSavings = waitAction
      ? Math.max(0, waitAction.dynamicTotalCost - action.dynamicTotalCost)
      : 0;
    const sensitivitySummary = `Sensitivity multipliers: delay ${sensitivity.delayMultiplier.toFixed(1)}x, overtime ${sensitivity.laborOvertimeRate.toFixed(1)}x, logistics ${sensitivity.logisticsMultiplier.toFixed(1)}x.`;

    setAdjustedRecommendation({
      recommendation: {
        order_id: scenario.orderId,
        recommended_action: action.action,
        recommended_action_title: action.title,
        predicted_impact_inr: action.dynamicTotalCost,
        formatted_predicted_impact_inr: formatINR(action.dynamicTotalCost),
        predicted_delay_minutes: action.delayMinutes,
        net_savings_inr: netSavings,
        formatted_net_savings_inr: formatINR(netSavings),
        risk_level: action.risk_level,
        confidence_level: 'Uncalibrated (rule-based)',
        top_reasons: [
          `Lowest sensitivity-adjusted estimate: ${formatINR(action.dynamicTotalCost)}${waitAction ? ` (${formatINR(netSavings)} less than waiting)` : ''}.`,
          `Projects ${action.delayMinutes} minutes of delay under this action.`,
          action.description,
          sensitivitySummary,
        ],
        uncertainty_flags: [
          'This deterministic estimate is illustrative, not a calibrated forecast or operational approval.',
          ...(action.assumptions || []),
        ],
        cost_breakdown: action.dynamicCostBreakdown,
      },
      explanation: {
        source: 'Sensitivity-adjusted cost model',
        is_fallback: true,
        explanation_text: `${action.title} ranks lowest by estimated cost for ${scenario.type} on order ${scenario.orderId}. The adjusted estimate is ${formatINR(action.dynamicTotalCost)} with a predicted delay of ${action.delayMinutes} minutes. ${sensitivitySummary} This is a rule-based comparison; validate feasibility and assumptions with an authorized supervisor.`,
      },
    });
    setActiveTab('explanation');
  };

  const handleExecuteDecision = async (action) => {
    setExecutedToast(`Authorized Decision: ${action.title}. Outcome recorded; factory data refreshed.`);
    setTimeout(() => setExecutedToast(null), 5000);
    await loadFactoryData();
  };

  const handleResetDemoState = async () => {
    const refreshed = await loadFactoryData();
    if (!refreshed) return false;
    setExecutedToast('Demo data reset successfully; factory state refreshed.');
    setTimeout(() => setExecutedToast(null), 4000);
    return true;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation Navbar */}
      <Navbar
        setActiveTab={setActiveTab}
        apiKey={apiKey}
        setApiKey={setApiKey}
        activeDisruptionsCount={disruptions.length}
        apiOnline={!isLoading && !apiError}
        onResetDemo={handleResetDemoState}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentOrder={currentOrder}
          currentDisruption={disruptions.find((event) => event.affected_order_id === currentOrder?.id)}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {apiError && (
            <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
              <strong>Backend unavailable:</strong> {apiError}
              <button onClick={loadFactoryData} className="ml-3 underline">Retry</button>
            </div>
          )}
          {isLoading && <p className="mb-4 text-xs text-slate-400">Loading factory data from the backend…</p>}
          {executedToast && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-top-4">
              <span>{executedToast}</span>
              <button onClick={() => setExecutedToast(null)} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {activeTab === 'landing' && (
            <LandingPage
              onStartSimulation={handleStartSimulation}
              onNavigate={setActiveTab}
              orders={orders}
              machines={machines}
              disruptions={disruptions}
            />
          )}

          {activeTab === 'overview' && (
            <FactoryOverviewPage
              machines={machines}
              orders={orders}
              rawMaterials={rawMaterials}
              disruptions={disruptions}
              onSimulateOrder={handleSelectOrderForSimulation}
            />
          )}

          {activeTab === 'disruptions' && (
            <DisruptionCenterPage
              disruptions={disruptions}
              orders={orders}
              machines={machines}
              onSimulateDisruption={handleSelectDisruptionFromCenter}
            />
          )}

          {activeTab === 'simulator' && (
            <DecisionSimulatorPage
              orderId={selectedOrderId || currentOrder?.id}
              disruption={selectedDisruption}
              order={orders.find((order) => order.id === selectedOrderId)}
              onSelectActionForExplanation={handleSelectActionForExplanation}
              onExecuteDecision={handleExecuteDecision}
            />
          )}

          {activeTab === 'explanation' && (
            <DecisionExplanationPage
              disruption={selectedDisruption}
              orderId={selectedOrderId || currentOrder?.id}
              order={orders.find((order) => order.id === selectedOrderId)}
              apiKey={apiKey}
              adjustedRecommendation={adjustedRecommendation}
              onNavigateToFeedback={() => setActiveTab('feedback')}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackLearningPage onResetDemo={handleResetDemoState} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboardPage />
          )}
        </main>
      </div>
    </div>
  );
}
