"""
REALRUN - Explanation Service (Backend Module)

Provides executive natural-language explanations of ALREADY-CALCULATED recommendation results.

CRITICAL RULE:
  The LLM is NEVER allowed to invent or calculate source-of-truth costs.
  It only summarizes and contextualizes pre-calculated numbers from the economic engine.
  If no Gemini API key is configured or offline, a deterministic fallback generator is used.
"""

import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def generate_explanation(
    recommendation_data: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates structured natural-language executive explanation.
    Uses Google Gemini API if API key is provided, else falls back cleanly to deterministic synthesis.
    """
    resolved_api_key = api_key or os.environ.get("GEMINI_API_KEY")
    order_id = recommendation_data.get("order_id", "selected order")
    action_title = recommendation_data.get("recommended_action_title", "No action available")
    cost_inr = recommendation_data.get("formatted_predicted_impact_inr", "₹0")
    savings_inr = recommendation_data.get("formatted_net_savings_inr", "₹0")
    delay_mins = recommendation_data.get("predicted_delay_minutes", 0)
    scenario = recommendation_data.get("recommended_scenario", {})
    alternatives = recommendation_data.get("alternative_scenarios", [])

    # Attempt Gemini API call if key is available
    if resolved_api_key:
        try:
            from google import genai
            client = genai.Client(api_key=resolved_api_key)
            prompt = f"""
            You are the REALRUN Counterfactual Decision Intelligence AI.
            Explain the following pre-calculated manufacturing decision recommendation for Order {order_id}:

            Recommended Action: {action_title}
            Calculated Economic Impact: {cost_inr}
            Estimated Net Savings vs Waiting: {savings_inr}
            Projected Delay: {delay_mins} minutes

            Current scenario context:
            {scenario.get("description", "No additional scenario details are available.")}
            Evaluated alternatives:
            {", ".join(f"{item.get('title', item.get('action'))}: ₹{item.get('predicted_cost', 0):,.0f}" for item in alternatives)}

            Instructions:
            - Write a concise, 3-paragraph executive operational brief.
            - Paragraph 1: Why {action_title} is recommended over waiting.
            - Paragraph 2: Downstream economic impact ({cost_inr}) and Lean Kaizen waste reduction.
            - Paragraph 3: Advisory note on supervisor commitment.
            - Do NOT recalculate or invent any numbers. Use only the provided figures.
            """
            response = client.models.generate_content(
                model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
                contents=prompt
            )
            if response and response.text:
                return {
                    "source": "Gemini 2.5 Flash",
                    "explanation_text": response.text.strip(),
                    "is_fallback": False
                }
        except Exception:
            logger.exception("Gemini explanation request failed; using deterministic explanation.")

    # Deterministic Kaizen Fallback Explanation
    fallback_text = (
        f"Executive Operational Brief for Order {order_id}:\n\n"
        f"1. Strategic Recommendation:\n"
        f"REALRUN counterfactual analysis recommends '{action_title}' based on the current order and machine state. "
        f"The projected delay for this option is {delay_mins} minutes.\n\n"
        f"2. Financial & Kaizen Impact:\n"
        f"The pre-calculated total economic cost for this action is {cost_inr}; the estimated difference versus waiting is {savings_inr}. "
        f"Use the itemized model breakdown to review the delay, labor, setup, logistics, production-loss, and delivery-risk components.\n\n"
        f"3. Operational Advisory:\n"
        "This recommendation is ADVISORY and uses prototype rates. Confirm equipment, material, labor, and delivery assumptions "
        "with the floor supervisor before authorizing any operational change."
    )

    return {
        "source": "REALRUN Deterministic Kaizen Engine (Offline Fallback)",
        "explanation_text": fallback_text,
        "is_fallback": True
    }
