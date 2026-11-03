const COST_DIMENSIONS = [
  ['Delay', 'delay_cost'],
  ['Overtime', 'overtime_cost'],
  ['Setup', 'setup_cost'],
  ['Logistics', 'logistics_cost'],
  ['Production loss', 'production_loss_cost'],
  ['Delivery exposure', 'delivery_exposure_cost'],
];

export function priceScenarios(
  scenarios,
  { delayMultiplier, laborOvertimeRate, logisticsMultiplier },
  recordedExposure = 0,
) {
  const baseline = Math.max(
    1,
    recordedExposure,
    ...scenarios.map((scenario) => scenario.predicted_cost || 0),
  );

  return scenarios.map((scenario) => {
    const breakdown = scenario.cost_breakdown || {};
    const dynamicCostBreakdown = {
      delay_cost: (breakdown.delay_cost || 0) * delayMultiplier,
      overtime_cost: (breakdown.overtime_cost || 0) * laborOvertimeRate,
      setup_cost: breakdown.setup_cost || 0,
      logistics_cost: (breakdown.logistics_cost || 0) * logisticsMultiplier,
      production_loss_cost: breakdown.production_loss_cost || 0,
      delivery_exposure_cost: breakdown.delivery_exposure_cost || 0,
    };
    const dynamicTotalCost = Math.round(
      Object.values(dynamicCostBreakdown).reduce((total, cost) => total + cost, 0),
    );

    return {
      ...scenario,
      id: scenario.id || scenario.action,
      delayMinutes: scenario.predicted_delay || scenario.delayMinutes || 0,
      dynamicCostBreakdown,
      dynamicImpactScore: Math.min(
        100,
        Math.max(1, Math.round((dynamicTotalCost / baseline) * 100)),
      ),
      dynamicTotalCost,
      formattedCost: `₹${dynamicTotalCost.toLocaleString('en-IN')}`,
    };
  });
}

export function getRecommendedAction(actions) {
  return actions.reduce(
    (lowest, action) => lowest === null || action.dynamicTotalCost < lowest.dynamicTotalCost
      ? action
      : lowest,
    null,
  );
}

export function buildRadarData(actions) {
  const maxTotalCost = Math.max(1, ...actions.map((action) => action.dynamicTotalCost));

  return COST_DIMENSIONS.map(([subject, field]) => ({
    subject,
    ...Object.fromEntries(actions.map((action) => [
      action.id,
      Math.round(((action.dynamicCostBreakdown[field] || 0) / maxTotalCost) * 100),
    ])),
  }));
}
