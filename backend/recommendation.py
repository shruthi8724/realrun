"""
REALRUN - Recommendation Engine (Backend Module)

Selects the optimal feasible candidate scenario with the lowest expected economic impact in INR.
Builds executive recommendation packages with evidence, uncertainty flags, top reasons,
and counterfactual alternatives.
"""

from typing import List, Dict, Any

def generate_recommendation(scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates simulated scenarios and produces an advisory recommendation.
    """
    if not scenarios:
        raise ValueError("No scenarios available for evaluation.")

    # Find scenario with minimum predicted cost
    sorted_scenarios = sorted(scenarios, key=lambda s: s["predicted_cost"])
    recommended = sorted_scenarios[0]
    alternatives = sorted_scenarios[1:]

    # Calculate net savings compared to WAIT (do nothing)
    wait_scenario = next((s for s in scenarios if s["id"] == "WAIT"), scenarios[0])
    wait_cost = wait_scenario["predicted_cost"]
    rec_cost = recommended["predicted_cost"]
    net_savings_inr = max(0.0, wait_cost - rec_cost)

    top_reasons = [
        f"Lowest estimated cost of ₹{rec_cost:,.0f} (₹{net_savings_inr:,.0f} less than waiting).",
        f"Projects {recommended['predicted_delay']} minutes of delay under this action.",
        recommended.get("description", "Uses the current factory state to select an operational response."),
        f"Kaizen assessment: {recommended.get('kaizen_waste_classification', 'Operational trade-off')}.",
    ]

    uncertainty_flags = [
        "Projected costs use configurable prototype rates and should be validated against plant data.",
        *recommended.get("assumptions", []),
    ]

    evidence_panel = [
        {"metric": "Selected action", "status": recommended["risk_level"], "detail": recommended["title"]},
        {"metric": "Projected delay", "status": f"{recommended['predicted_delay']} min", "detail": "Estimate from current order state"},
        {"metric": "Cost basis", "status": "INR", "detail": f"Estimated impact ₹{rec_cost:,.0f}"},
        {"metric": "Decision authority", "status": "ADVISORY", "detail": "Supervisor approval required"},
    ]

    return {
        "order_id": recommended["order_id"],
        "recommended_action": recommended["action"],
        "recommended_action_title": recommended["title"],
        "predicted_impact_inr": rec_cost,
        "formatted_predicted_impact_inr": f"₹{rec_cost:,.0f}",
        "predicted_delay_minutes": recommended["predicted_delay"],
        "net_savings_inr": net_savings_inr,
        "formatted_net_savings_inr": f"₹{net_savings_inr:,.0f}",
        "risk_level": recommended["risk_level"],
        "confidence_level": "Uncalibrated (rule-based)",
        "is_advisory": True,
        "disclaimer": "This recommendation is ADVISORY. Final execution authorization requires human supervisor confirmation.",
        "top_reasons": top_reasons,
        "uncertainty_flags": uncertainty_flags,
        "evidence_panel": evidence_panel,
        "cost_breakdown": recommended["cost_breakdown"],
        "recommended_scenario": recommended,
        "alternative_scenarios": alternatives
    }
