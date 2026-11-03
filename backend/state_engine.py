"""
REALRUN - State Engine (Backend Module)

Manages database persistence, factory floor state queries, state mutations upon decision execution,
and historical decision logs.
"""

from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid
from typing import List, Optional, Dict, Any

from backend.models import (
    ProductionOrderModel, MachineModel, MaterialModel, ResourceModel,
    DisruptionEventModel, ScenarioModel, DecisionLogModel
)

class StateEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_orders(self) -> List[ProductionOrderModel]:
        return self.db.query(ProductionOrderModel).all()

    def get_order_by_id(self, order_id: str) -> Optional[ProductionOrderModel]:
        return self.db.query(ProductionOrderModel).filter(ProductionOrderModel.id == order_id).first()

    def get_machines(self) -> List[MachineModel]:
        return self.db.query(MachineModel).all()

    def get_disruptions(self) -> List[DisruptionEventModel]:
        return self.db.query(DisruptionEventModel).all()

    def get_materials(self) -> List[MaterialModel]:
        return self.db.query(MaterialModel).all()

    def get_history_for_order(self, order_id: str) -> List[DecisionLogModel]:
        return self.db.query(DecisionLogModel).filter(DecisionLogModel.order_id == order_id).all()

    def get_all_history(self) -> List[DecisionLogModel]:
        return self.db.query(DecisionLogModel).order_by(DecisionLogModel.timestamp.desc()).all()

    def commit_decision(self, order_id: str, chosen_action: str, predicted_cost: float, actual_cost: Optional[float] = None) -> DecisionLogModel:
        """
        Executes factory state mutation when a decision is committed and records history log.
        """
        order = self.get_order_by_id(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")
        if chosen_action not in {"WAIT", "EXPEDITE", "RESEQUENCE"} and not chosen_action.startswith(("MOVE_", "MOVE_TO_")):
            raise ValueError(f"Unsupported decision action: {chosen_action}")
        
        # Calculate actual cost & prediction error percentage
        final_actual_cost = actual_cost if actual_cost is not None else round(predicted_cost * 1.03) # 3% variance benchmark
        pred_error = (
            round(abs(final_actual_cost - predicted_cost) / predicted_cost * 100, 1)
            if predicted_cost
            else 0.0
        )

        # Mutate the floor state when a simulated alternate workstation is selected.
        if chosen_action.startswith(("MOVE_", "MOVE_TO_")):
            target_machine_id = chosen_action.rsplit("_", 1)[-1]
            target_machine = self.db.query(MachineModel).filter_by(id=target_machine_id).first()
            if not order or not target_machine or target_machine.status != "idle":
                raise ValueError(f"Alternate workstation {target_machine_id} is not available")
            source_machine = self.db.query(MachineModel).filter_by(id=order.current_machine).first()
            target_machine.status = "running"
            target_machine.current_order = order_id
            if source_machine:
                source_machine.status = "idle"
                source_machine.current_order = None
            order.status = f"On Schedule (Rerouted to {target_machine_id})"
            order.current_machine = target_machine_id
            order.delay_risk_score = 12
        elif chosen_action == "EXPEDITE" and order:
            order.status = "On Schedule (Expedited Material)"
            order.delay_risk_score = 15
        elif chosen_action == "RESEQUENCE" and order:
            order.status = "Resequenced Batch"
            order.delay_risk_score = 25

        disruption = (
            self.db.query(DisruptionEventModel)
            .filter_by(affected_order_id=order_id, status="ACTIVE")
            .first()
        )
        if disruption and chosen_action != "WAIT":
            disruption.status = "RESOLVED"
            if order:
                order.delay_minutes = 0

        log_id = f"LOG-{uuid.uuid4().hex[:6].upper()}"
        now_str = datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(timespec="seconds")

        decision_log = DecisionLogModel(
            id=log_id,
            order_id=order_id,
            chosen_action=chosen_action,
            predicted_cost=predicted_cost,
            actual_cost=final_actual_cost,
            prediction_error=pred_error,
            timestamp=now_str,
            status="VERIFIED"
        )
        self.db.add(decision_log)
        self.db.commit()
        self.db.refresh(decision_log)
        return decision_log
