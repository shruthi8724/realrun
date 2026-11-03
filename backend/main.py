"""
REALRUN - FastAPI Main Application (Backend Module)

Exposes REST API endpoints for counterfactual decision intelligence:
  - GET  /orders
  - GET  /orders/{id}
  - POST /events
  - GET  /assessment/{order_id}
  - POST /simulate/{order_id}
  - POST /recommend/{order_id}
  - POST /outcomes
  - GET  /history/{order_id}
  - POST /reset-demo
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from collections import Counter, defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid
import os
from typing import List, Dict, Any, Optional

from backend.database import get_db, ensure_schema
from backend.models import (
    ProductionOrderSchema, MachineSchema, MaterialSchema, DisruptionEventSchema,
    DecisionLogSchema, DecisionCommitRequest, ExplanationRequest, DisruptionEventCreate,
    DisruptionEventModel, ProductionOrderModel
)
from backend.state_engine import StateEngine
from backend.simulation_engine import simulate_order_scenarios
from backend.recommendation import generate_recommendation
from backend.explanation_service import generate_explanation
from backend.seed import seed_database

# Ensure database tables exist on startup
ensure_schema()

app = FastAPI(
    title="REALRUN — Counterfactual Economic Decision Intelligence API",
    description="India–Japan Innovation Hackathon 2026 Open Innovation Prototype",
    version="1.0.0"
)

# Enable CORS for Vite frontend
cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "REALRUN_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]


def normalize_ist_timestamp(value: Optional[str]) -> str:
    if not value:
        return datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(timespec="seconds")
    try:
        timestamp = datetime.fromisoformat(value)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="start_time must be an ISO 8601 timestamp") from error
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
    return timestamp.astimezone(ZoneInfo("Asia/Kolkata")).isoformat(timespec="seconds")


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Automatically seed database if empty
    db = next(get_db())
    try:
        state = StateEngine(db)
        if not state.get_orders():
            seed_database()
    finally:
        db.close()


@app.get("/")
def read_root():
    return {
        "system": "REALRUN",
        "status": "OPERATIONAL",
        "message": "Counterfactual Economic Decision Intelligence API is active",
        "currency": "INR (₹)"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    state = StateEngine(db)
    return {
        "status": "OPERATIONAL",
        "orders": len(state.get_orders()),
        "machines": len(state.get_machines()),
        "active_disruptions": sum(
            disruption.status == "ACTIVE" for disruption in state.get_disruptions()
        ),
        "currency": "INR (₹)",
        "timezone": "Asia/Kolkata",
    }


@app.get("/orders", response_model=List[ProductionOrderSchema])
def get_all_orders(db: Session = Depends(get_db)):
    state = StateEngine(db)
    return state.get_orders()


@app.get("/orders/{order_id}", response_model=ProductionOrderSchema)
def get_order_by_id(order_id: str, db: Session = Depends(get_db)):
    state = StateEngine(db)
    order = state.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@app.get("/machines", response_model=List[MachineSchema])
def get_all_machines(db: Session = Depends(get_db)):
    state = StateEngine(db)
    return state.get_machines()


@app.get("/disruptions", response_model=List[DisruptionEventSchema])
def get_all_disruptions(db: Session = Depends(get_db)):
    return [event for event in StateEngine(db).get_disruptions() if event.status == "ACTIVE"]


@app.get("/materials", response_model=List[MaterialSchema])
def get_all_materials(db: Session = Depends(get_db)):
    state = StateEngine(db)
    return state.get_materials()


@app.post("/events", response_model=DisruptionEventSchema)
def create_disruption_event(event_data: DisruptionEventCreate, db: Session = Depends(get_db)):
    order = StateEngine(db).get_order_by_id(event_data.affected_order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {event_data.affected_order_id} not found")
    event = DisruptionEventModel(
        id=event_data.id or f"DIS-{uuid.uuid4().hex[:10].upper()}",
        type=event_data.type,
        severity=event_data.severity,
        start_time=normalize_ist_timestamp(event_data.start_time),
        affected_order_id=event_data.affected_order_id,
        description=event_data.description,
        root_cause=event_data.root_cause,
        financial_risk_inr=event_data.financial_risk_inr,
        status="ACTIVE",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.get("/assessment/{order_id}")
def get_disruption_assessment(order_id: str, db: Session = Depends(get_db)):
    state = StateEngine(db)
    order = state.get_order_by_id(order_id)
    disruptions = state.get_disruptions()
    disruption = next((d for d in disruptions if d.affected_order_id == order_id and d.status == "ACTIVE"), None)

    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    return {
        "order": order,
        "disruption": disruption,
        "risk_exposure_inr": disruption.financial_risk_inr if disruption else 0.0,
        "formatted_risk_exposure_inr": f"₹{disruption.financial_risk_inr if disruption else 0.0:,.0f}",
        "primary_machine": order.current_machine,
        "standby_machine": next((machine.id for machine in state.get_machines() if machine.status == "idle"), None),
        "standby_machine_status": "Idle" if any(machine.status == "idle" for machine in state.get_machines()) else "No idle machine",
        "tooling_status": "Validate compatibility with plant data"
    }


@app.post("/simulate/{order_id}")
def simulate_counterfactuals(order_id: str, db: Session = Depends(get_db)):
    """
    Runs counterfactual scenario simulations comparing candidate decisions.
    """
    scenarios = simulate_order_scenarios(order_id, db)
    if not scenarios:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return {
        "order_id": order_id,
        "scenario_count": len(scenarios),
        "currency": "INR (₹)",
        "scenarios": scenarios
    }


@app.post("/recommend/{order_id}")
def get_recommendation_and_explanation(
    order_id: str,
    payload: Optional[ExplanationRequest] = None,
    db: Session = Depends(get_db)
):
    scenarios = simulate_order_scenarios(order_id, db)
    if not scenarios:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    recommendation = generate_recommendation(scenarios)

    api_key = payload.api_key if payload else None
    explanation = generate_explanation(recommendation, api_key=api_key)

    return {
        "recommendation": recommendation,
        "explanation": explanation
    }


@app.post("/outcomes", response_model=DecisionLogSchema)
def commit_decision_outcome(payload: DecisionCommitRequest, db: Session = Depends(get_db)):
    state = StateEngine(db)
    try:
        log = state.commit_decision(
            order_id=payload.order_id,
            chosen_action=payload.chosen_action,
            predicted_cost=payload.predicted_cost,
            actual_cost=payload.actual_cost
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return log


@app.get("/history/{order_id}", response_model=List[DecisionLogSchema])
def get_decision_history(order_id: str, db: Session = Depends(get_db)):
    state = StateEngine(db)
    if order_id == "all":
        return state.get_all_history()
    return state.get_history_for_order(order_id)


@app.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    state = StateEngine(db)
    history = state.get_all_history()
    disruptions = state.get_disruptions()

    monthly = defaultdict(lambda: {"month": "", "decisions": 0, "predictedCost": 0, "actualCost": 0})
    for log in history:
        try:
            timestamp = datetime.fromisoformat(log.timestamp)
            month_key = timestamp.strftime("%Y-%m")
            bucket = monthly[month_key]
            bucket["month"] = timestamp.strftime("%b %Y")
            bucket["decisions"] += 1
            bucket["predictedCost"] += log.predicted_cost
            bucket["actualCost"] += log.actual_cost
        except (TypeError, ValueError):
            continue

    errors = [log.prediction_error for log in history]
    return {
        "metrics": {
            "committedDecisions": len(history),
            "averagePredictionError": round(sum(errors) / len(errors), 1) if errors else None,
            "totalPredictedCost": round(sum(log.predicted_cost for log in history)),
            "totalActualCost": round(sum(log.actual_cost for log in history)),
        },
        "monthly": [monthly[key] for key in sorted(monthly)],
        "disruptionTypes": [
            {"name": name, "count": count}
            for name, count in Counter(event.type for event in disruptions).items()
        ],
        "disruptions": len(disruptions),
    }


@app.post("/reset-demo")
def reset_demo_data():
    if os.environ.get("REALRUN_ENABLE_DEMO_RESET", "").lower() not in {"1", "true", "yes"}:
        raise HTTPException(
            status_code=403,
            detail="Demo reset is disabled. Set REALRUN_ENABLE_DEMO_RESET=true for a local demo.",
        )
    seed_database()
    return {
        "status": "RESET_SUCCESSFUL",
        "message": "REALRUN database reset to the sample factory dataset."
    }
