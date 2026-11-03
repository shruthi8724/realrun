from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.database import Base

# ==========================================
# SQLAlchemy ORM Models
# ==========================================

class ProductionOrderModel(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    due_at = Column(String, nullable=False)
    priority = Column(String, default="Normal")
    current_machine = Column(String, nullable=False)
    status = Column(String, nullable=False)
    customer = Column(String, nullable=False)
    material_name = Column(String, nullable=False)
    delay_risk_score = Column(Integer, default=10)
    delay_minutes = Column(Integer, default=0)


class MachineModel(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # running, delayed, idle, maintenance
    capacity_available = Column(Integer, default=100) # %
    setup_cost_rate = Column(Float, default=15000.0) # INR / setup
    efficiency = Column(Integer, default=90)
    current_order = Column(String, nullable=True)
    operator = Column(String, nullable=True)
    material_needed = Column(String, nullable=True)
    temperature = Column(String, default="30°C")
    max_capacity_units_hr = Column(Integer, default=100)
    hourly_operating_cost = Column(Float, default=12000.0) # INR / hr
    setup_time_minutes = Column(Integer, default=15)


class MaterialModel(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    required_qty = Column(Integer, default=100)
    available_qty = Column(Integer, default=100)
    expected_arrival = Column(String, nullable=True)
    stock = Column(String, nullable=False)
    status = Column(String, nullable=False)
    affected_order_id = Column(String, nullable=True)


class ResourceModel(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # Tooling, Skill, Vehicle
    availability = Column(String, nullable=False)  # Available, In Use, Reserved
    skill_or_tool_mapping = Column(String, nullable=False)


class DisruptionEventModel(Base):
    __tablename__ = "disruptions"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # Material Delay, Machine Breakdown, etc.
    severity = Column(String, default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    start_time = Column(String, nullable=False)
    affected_order_id = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=True)
    financial_risk_inr = Column(Float, default=0.0)
    status = Column(String, nullable=False, default="ACTIVE")


class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, nullable=False)
    action = Column(String, nullable=False)  # WAIT, MOVE_M06, EXPEDITE, RESEQUENCE
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    assumptions = Column(JSON, nullable=True)
    predicted_delay = Column(Integer, nullable=False) # mins
    predicted_cost = Column(Float, nullable=False) # INR
    cost_breakdown = Column(JSON, nullable=False)
    kaizen_waste_classification = Column(String, nullable=True)
    risk_level = Column(String, default="MEDIUM")
    recommendation_status = Column(String, nullable=True)


class DecisionLogModel(Base):
    __tablename__ = "decision_logs"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, nullable=False)
    chosen_action = Column(String, nullable=False)
    predicted_cost = Column(Float, nullable=False)
    actual_cost = Column(Float, nullable=False)
    prediction_error = Column(Float, nullable=False) # percentage error
    timestamp = Column(String, nullable=False)
    status = Column(String, default="VERIFIED")


# ==========================================
# Pydantic Schemas for API
# ==========================================

class ProductionOrderSchema(BaseModel):
    id: str
    product: str
    quantity: int
    completed_quantity: int
    due_at: str
    priority: str
    current_machine: str
    status: str
    customer: str
    material_name: str
    delay_risk_score: int
    delay_minutes: int

    class Config:
        from_attributes = True


class MachineSchema(BaseModel):
    id: str
    name: str
    status: str
    capacity_available: int
    setup_cost_rate: float
    efficiency: int
    current_order: Optional[str] = None
    operator: Optional[str] = None
    material_needed: Optional[str] = None
    temperature: str
    max_capacity_units_hr: int
    hourly_operating_cost: float
    setup_time_minutes: int

    class Config:
        from_attributes = True


class MaterialSchema(BaseModel):
    id: str
    name: str
    required_qty: int
    available_qty: int
    expected_arrival: Optional[str] = None
    stock: str
    status: str
    affected_order_id: Optional[str] = None

    class Config:
        from_attributes = True


class DisruptionEventSchema(BaseModel):
    id: str
    type: str
    severity: str
    start_time: str
    affected_order_id: str
    description: str
    root_cause: Optional[str] = None
    financial_risk_inr: float
    status: str = "ACTIVE"

    class Config:
        from_attributes = True


class DisruptionEventCreate(BaseModel):
    type: str
    affected_order_id: str
    description: str
    severity: str = "HIGH"
    start_time: Optional[str] = None
    root_cause: Optional[str] = None
    financial_risk_inr: float = Field(default=0, ge=0)
    id: Optional[str] = None


class ScenarioSchema(BaseModel):
    id: str
    order_id: str
    action: str
    title: str
    description: str
    assumptions: Optional[List[str]] = []
    predicted_delay: int
    predicted_cost: float
    cost_breakdown: Dict[str, float]
    kaizen_waste_classification: Optional[str] = None
    risk_level: Optional[str] = "MEDIUM"
    recommendation_status: Optional[str] = None

    class Config:
        from_attributes = True


class DecisionLogSchema(BaseModel):
    id: str
    order_id: str
    chosen_action: str
    predicted_cost: float
    actual_cost: float
    prediction_error: float
    timestamp: str
    status: str = "VERIFIED"

    class Config:
        from_attributes = True


class DecisionCommitRequest(BaseModel):
    order_id: str
    chosen_action: str
    predicted_cost: float = Field(ge=0)
    actual_cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class ExplanationRequest(BaseModel):
    order_id: str
    api_key: Optional[str] = None
