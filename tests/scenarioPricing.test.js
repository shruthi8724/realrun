import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRadarData,
  getRecommendedAction,
  priceScenarios,
} from '../src/services/scenarioPricing.js';

const candidates = [
  {
    id: 'WAIT',
    action: 'WAIT',
    title: 'Wait',
    predicted_delay: 30,
    predicted_cost: 1000,
    cost_breakdown: {
      delay_cost: 400,
      overtime_cost: 100,
      setup_cost: 50,
      logistics_cost: 200,
      production_loss_cost: 150,
      delivery_exposure_cost: 100,
    },
  },
  {
    id: 'EXPEDITE',
    action: 'EXPEDITE',
    title: 'Expedite',
    predicted_delay: 5,
    predicted_cost: 950,
    cost_breakdown: {
      delay_cost: 100,
      overtime_cost: 50,
      setup_cost: 100,
      logistics_cost: 600,
      production_loss_cost: 50,
      delivery_exposure_cost: 50,
    },
  },
];

const baseline = {
  delayMultiplier: 1,
  laborOvertimeRate: 1,
  logisticsMultiplier: 1,
};

test('sliders reprice actions and update their score and recommendation', () => {
  const baseActions = priceScenarios(candidates, baseline);
  assert.equal(baseActions[0].dynamicTotalCost, 1000);
  assert.equal(getRecommendedAction(baseActions).id, 'EXPEDITE');

  const highDelayPenalty = priceScenarios(candidates, {
    ...baseline,
    delayMultiplier: 2,
  });
  assert.equal(highDelayPenalty[0].dynamicTotalCost, 1400);
  assert.equal(highDelayPenalty[1].dynamicTotalCost, 1050);
  assert.equal(getRecommendedAction(highDelayPenalty).id, 'EXPEDITE');
  assert.deepEqual(
    highDelayPenalty.map(({ action, delayMinutes }) => [action, delayMinutes]),
    baseActions.map(({ action, delayMinutes }) => [action, delayMinutes]),
  );
  assert.notEqual(highDelayPenalty[1].dynamicImpactScore, baseActions[1].dynamicImpactScore);

  const higherOvertimeRate = priceScenarios(candidates, {
    ...baseline,
    laborOvertimeRate: 2,
  });
  assert.equal(higherOvertimeRate[0].dynamicTotalCost, 1100);
  assert.equal(higherOvertimeRate[1].dynamicTotalCost, 1000);
});

test('logistics slider reprices logistics-heavy alternatives', () => {
  const actions = priceScenarios(candidates, {
    ...baseline,
    logisticsMultiplier: 1.5,
  });
  assert.equal(actions[0].dynamicTotalCost, 1100);
  assert.equal(actions[1].dynamicTotalCost, 1250);
  assert.equal(getRecommendedAction(actions).id, 'WAIT');
});

test('radar dimensions use sensitivity-adjusted cost contributions', () => {
  const baseActions = priceScenarios(candidates, baseline);
  const higherLogisticsActions = priceScenarios(candidates, {
    ...baseline,
    logisticsMultiplier: 2,
  });
  const baseRadar = buildRadarData(baseActions);
  const updatedRadar = buildRadarData(higherLogisticsActions);

  assert.equal(baseRadar.find((axis) => axis.subject === 'Logistics').EXPEDITE, 60);
  assert.equal(updatedRadar.find((axis) => axis.subject === 'Logistics').EXPEDITE, 77);
  assert.notDeepEqual(updatedRadar, baseRadar);
});
