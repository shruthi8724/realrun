"""
REALRUN - Economic Impact Engine (Backend Module)

Computes transparent additive economic impact in Indian Rupees (₹ / INR).

Formula:
  Expected Economic Impact = 
      Delay Cost
    + Overtime Cost
    + Setup / Movement Cost
    + Logistics Cost
    + Production Loss Cost
    + Delivery Exposure Cost
"""

from typing import Dict, Any, Optional

DEFAULT_RATES_INR = {
    "delay_per_minute_rate": 4500.0,       # ₹4,500 / min delay
    "overtime_hourly_rate": 24000.0,        # ₹24,000 / hr overtime labor
    "machine_setup_base": 32000.0,          # ₹32,000 setup recalibration fee
    "emergency_courier_base": 180000.0,     # ₹1,80,000 hot-shot logistics
    "resequence_setup_base": 65000.0,       # ₹65,000 dual setup loss
    "late_delivery_sla_penalty": 850000.0,  # ₹8,50,000 customer SLA penalty
    "minor_resequence_penalty": 120000.0,   # ₹1,20,000 displaced order penalty
}


def calculate_economic_impact(
    delay_minutes: int,
    idle_hours: float = 0.0,
    overtime_hours: float = 0.0,
    setup_cost_flat: float = 0.0,
    logistics_cost_flat: float = 0.0,
    production_loss_cost: float = 0.0,
    delivery_exposure_cost: float = 0.0,
    custom_rates: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes transparent additive economic cost in Indian Rupees (INR).
    Returns total cost and itemized breakdown dictionary.
    """
    rates = {**DEFAULT_RATES_INR, **(custom_rates or {})}

    # 1. Delay Cost
    delay_cost = float(delay_minutes * rates["delay_per_minute_rate"])

    # 2. Overtime Cost
    overtime_cost = float(overtime_hours * rates["overtime_hourly_rate"])

    # 3. Setup / Movement Cost
    setup_cost = float(setup_cost_flat)

    # 4. Logistics Cost
    logistics_cost = float(logistics_cost_flat)

    # 5. Production Loss Cost
    prod_loss_cost = float(production_loss_cost)

    # 6. Delivery Exposure Cost
    delivery_exposure = float(delivery_exposure_cost)

    # Total Additive Impact
    total_cost_inr = round(
        delay_cost +
        overtime_cost +
        setup_cost +
        logistics_cost +
        prod_loss_cost +
        delivery_exposure
    )

    # Normalized Impact Score (0 to 100, lower is better)
    # Baseline maximum risk exposure = ₹14,50,000
    baseline_max_exposure = 1450000.0
    impact_score = min(100, max(1, round((total_cost_inr / baseline_max_exposure) * 100)))

    return {
        "impact_score": impact_score,
        "total_cost_inr": total_cost_inr,
        "formatted_cost_inr": f"₹{total_cost_inr:,.0f}",
        "cost_breakdown": {
            "delay_cost": delay_cost,
            "overtime_cost": overtime_cost,
            "setup_cost": setup_cost,
            "logistics_cost": logistics_cost,
            "production_loss_cost": prod_loss_cost,
            "delivery_exposure_cost": delivery_exposure
        }
    }
