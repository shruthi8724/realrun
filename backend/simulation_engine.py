"""
Generate counterfactual scenarios from the current persisted factory state.
All projected financial values are expressed in Indian Rupees.
"""

from typing import Any, Dict, List
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from backend.economic_engine import calculate_economic_impact
from backend.models import DisruptionEventModel, MachineModel, ProductionOrderModel


def simulate_order_scenarios(
    order_id: str,
    db: Session,
) -> List[Dict[str, Any]]:
    order = db.query(ProductionOrderModel).filter_by(id=order_id).first()
    if not order:
        return []

    source_machine = db.query(MachineModel).filter_by(id=order.current_machine).first()
    disruption = (
        db.query(DisruptionEventModel)
        .filter_by(affected_order_id=order_id, status="ACTIVE")
        .order_by(DisruptionEventModel.start_time.desc())
        .first()
    )
    standby_machine = (
        db.query(MachineModel)
        .filter(MachineModel.id != order.current_machine, MachineModel.status == "idle")
        .filter(MachineModel.material_needed == order.material_name)
        .order_by(MachineModel.id)
        .first()
    )
    elapsed_minutes = 0
    if disruption:
        try:
            started_at = datetime.fromisoformat(disruption.start_time)
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            elapsed_minutes = max(
                0,
                int((datetime.now(ZoneInfo("Asia/Kolkata")) - started_at).total_seconds() / 60),
            )
        except ValueError:
            elapsed_minutes = 0
    delay_minutes = max(order.delay_minutes or 0, min(elapsed_minutes, 90), 5)
    exposure = disruption.financial_risk_inr if disruption else 0
    disruption_type = (disruption.type if disruption else "").lower()

    case_parameters = {
        "machine breakdown": {
            "wait_delay": max(delay_minutes, 45),
            "wait_overtime": 2.0,
            "wait_loss": 65000,
            "move_delay": 12,
            "move_logistics": 25000,
            "expedite_title": "Expedite Maintenance Parts and Technician",
            "expedite_description": "Arrange priority delivery of the required machine part and maintenance support.",
            "expedite_delay": 30,
            "expedite_cost": 225000,
            "expedite_assumption": "Priority maintenance parts and technician support are available.",
            "kaizen": "Muda of Waiting & unplanned maintenance",
        },
        "quality failure": {
            "wait_delay": max(delay_minutes, 25),
            "wait_overtime": 0.5,
            "wait_loss": 90000,
            "move_delay": 15,
            "move_logistics": 30000,
            "expedite_title": "Prioritize Metrology and Quality Recheck",
            "expedite_description": "Move the held batch to an expedited inspection queue before authorizing rework.",
            "expedite_delay": 8,
            "expedite_cost": 95000,
            "expedite_assumption": "An expedited inspection slot is available; rework is approved only after inspection.",
            "kaizen": "Muda of Defects and excess inspection",
        },
        "tool missing": {
            "wait_delay": max(delay_minutes, 20),
            "wait_overtime": 0.5,
            "wait_loss": 35000,
            "move_delay": 10,
            "move_logistics": 18000,
            "expedite_title": "Expedite an Approved Tool Substitute",
            "expedite_description": "Retrieve an approved substitute tool from the nearest tool crib.",
            "expedite_delay": 6,
            "expedite_cost": 42000,
            "expedite_assumption": "An approved substitute tool is available from the nearest tool crib.",
            "kaizen": "Muda of Waiting and unnecessary motion",
        },
        "supplier delay": {
            "wait_delay": max(delay_minutes, 30),
            "wait_overtime": 1.0,
            "wait_loss": 45000,
            "move_delay": 10,
            "move_logistics": 20000,
            "expedite_title": "Expedite Supplier Replenishment",
            "expedite_description": "Request priority dispatch from the supplier to protect the replenishment window.",
            "expedite_delay": 8,
            "expedite_cost": 165000,
            "expedite_assumption": "The supplier can confirm a priority dispatch for the replenishment.",
            "kaizen": "Muda of Waiting and excess inventory risk",
        },
    }
    parameters = {
        "wait_delay": delay_minutes,
        "wait_overtime": 1.5,
        "wait_loss": 40000,
        "move_delay": max(1, min(8, delay_minutes)),
        "move_logistics": 15000,
        "expedite_title": "Expedite the Required Material",
        "expedite_description": "Arrange priority supplier transport to reduce the material-related delay.",
        "expedite_delay": max(1, min(5, delay_minutes)),
        "expedite_cost": 180000,
        "expedite_assumption": "Priority transport can reduce the remaining material delay.",
        "kaizen": "Muda of Waiting & Muri (Overtime Fatigue)",
    }
    for event_type, overrides in case_parameters.items():
        if event_type in disruption_type:
            parameters.update(overrides)
            break
    def build_scenario(
        scenario_id: str,
        action: str,
        title: str,
        description: str,
        delay: int,
        overtime: float = 0,
        setup: float = 0,
        logistics: float = 0,
        production_loss: float = 0,
        delivery_exposure: float = 0,
        risk: str = "MEDIUM",
        kaizen: str = "Operational trade-off",
        assumptions: List[str] | None = None,
    ) -> Dict[str, Any]:
        impact = calculate_economic_impact(
            delay_minutes=delay,
            overtime_hours=overtime,
            setup_cost_flat=setup,
            logistics_cost_flat=logistics,
            production_loss_cost=production_loss,
            delivery_exposure_cost=delivery_exposure,
        )
        return {
            "id": scenario_id,
            "order_id": order_id,
            "action": action,
            "title": title,
            "description": description,
            "assumptions": assumptions or [],
            "predicted_delay": delay,
            "predicted_cost": impact["total_cost_inr"],
            "cost_breakdown": impact["cost_breakdown"],
            "kaizen_waste_classification": kaizen,
            "risk_level": risk,
            "recommendation_status": "",
        }

    move_available = standby_machine is not None
    move_setup_cost = (
        round(standby_machine.hourly_operating_cost * standby_machine.setup_time_minutes / 60)
        if move_available
        else 0
    )

    scenarios = [
        build_scenario(
            "WAIT",
            "WAIT",
            "Wait for the Current Blocker to Clear",
            f"Keep {order.current_machine} assigned while resolving the current production delay.",
            parameters["wait_delay"],
            overtime=parameters["wait_overtime"],
            production_loss=parameters["wait_loss"],
            delivery_exposure=exposure,
            risk="HIGH",
            kaizen=parameters["kaizen"],
            assumptions=[
                f"The current {delay_minutes}-minute delay remains representative.",
                "The assigned machine remains available while the blocker is addressed.",
            ],
        ),
        build_scenario(
            f"MOVE_{standby_machine.id if move_available else 'ALTERNATE'}",
            f"MOVE_TO_{standby_machine.id if move_available else 'ALTERNATE'}",
            f"Reroute {order_id} to {standby_machine.id if move_available else 'an idle machine'}",
            (
                f"Transfer production from {order.current_machine} to idle workstation "
                f"{standby_machine.id}."
                if move_available
                else "No idle workstation qualified for this order's material is available; rerouting is not feasible."
            ),
            parameters["move_delay"] if move_available else parameters["wait_delay"] + 30,
            setup=move_setup_cost,
            logistics=parameters["move_logistics"] if move_available else 0,
            delivery_exposure=0 if move_available else exposure,
            risk="LOW" if move_available else "HIGH",
            kaizen="Reduced waiting through alternate capacity" if move_available else "Alternate capacity unavailable",
            assumptions=[
                f"Order currently assigned to {order.current_machine}.",
                f"A qualified idle workstation {'is' if move_available else 'is not'} available.",
            ],
        ),
        build_scenario(
            "EXPEDITE",
            "EXPEDITE",
            parameters["expedite_title"],
            parameters["expedite_description"],
            parameters["expedite_delay"],
            logistics=parameters["expedite_cost"],
            risk="MEDIUM",
            kaizen="Muda of Transport (Expedited Logistics)",
            assumptions=[parameters["expedite_assumption"]],
        ),
        build_scenario(
            "RESEQUENCE",
            "RESEQUENCE",
            "Resequence the Production Queue",
            "Temporarily advance another eligible order while resolving this order's blocker.",
            max(1, min(10, delay_minutes)),
            overtime=0.5,
            setup=65000,
            production_loss=20000,
            delivery_exposure=120000,
            risk="MEDIUM",
            kaizen="Dual setup loss (Muda of Motion & Processing)",
            assumptions=["A compatible order is available to run before this order."],
        ),
    ]

    if source_machine:
        scenarios[0]["description"] += (
            f" {source_machine.id} operates at {source_machine.efficiency}% reported efficiency."
        )
    return scenarios
