"""
Seed a realistic, synthetic factory dataset for exercising every dashboard view.

All records are illustrative demo data. Running the seeder replaces the database.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from backend.database import Base, SessionLocal, engine
from backend.models import (
    DecisionLogModel,
    DisruptionEventModel,
    MachineModel,
    MaterialModel,
    ProductionOrderModel,
)


def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        due_times = [
            (now + timedelta(hours=hours)).isoformat(timespec="seconds")
            for hours in (2, 2.5, 1.5, 3, 3.5, 4, 5)
        ]

        machines = [
            MachineModel(id="M01", name="Laser Cutter Heavy Duty", status="running", efficiency=94, current_order="O-101", operator="Arjun Mehta", material_needed="Steel Sheet", temperature="42°C", max_capacity_units_hr=120, hourly_operating_cost=14500, setup_time_minutes=15),
            MachineModel(id="M02", name="CNC Milling Station Alpha", status="running", efficiency=88, current_order="O-145", operator="Priya Nair", material_needed="Aluminum Plate", temperature="55°C", max_capacity_units_hr=80, hourly_operating_cost=18000, setup_time_minutes=20),
            MachineModel(id="M03", name="CNC Milling Station Beta", status="delayed", efficiency=62, current_order="O-182", operator="Rohan Sharma", material_needed="Steel Sheet Grade A", temperature="68°C (Elevated)", max_capacity_units_hr=85, hourly_operating_cost=17500, setup_time_minutes=25),
            MachineModel(id="M04", name="Robotic Welding Cell X", status="running", efficiency=98, current_order="O-221", operator="Automated Robot R-4", material_needed="Copper Coil", temperature="38°C", max_capacity_units_hr=200, hourly_operating_cost=21000, setup_time_minutes=10),
            MachineModel(id="M05", name="Precision Assembly Line 1", status="running", efficiency=91, current_order="O-315", operator="Ananya Iyer", material_needed="Plastic Resin", temperature="28°C", max_capacity_units_hr=150, hourly_operating_cost=13000, setup_time_minutes=12),
            MachineModel(id="M06", name="Flexible Multi-Axis Milling Center", status="idle", efficiency=96, current_order=None, operator="Vikram Patel (Standby)", material_needed="Steel Sheet Grade A", temperature="24°C", max_capacity_units_hr=110, hourly_operating_cost=16000, setup_time_minutes=8),
            MachineModel(id="M07", name="Precision Turning Cell", status="maintenance", efficiency=0, current_order="O-401", operator="Sanjay Rao", material_needed="Titanium Alloy", temperature="31°C", max_capacity_units_hr=65, hourly_operating_cost=19500, setup_time_minutes=30),
            MachineModel(id="M08", name="Automated Quality Finishing Cell", status="delayed", efficiency=54, current_order="O-428", operator="Neha Kulkarni", material_needed="Composite Panel", temperature="49°C", max_capacity_units_hr=95, hourly_operating_cost=15500, setup_time_minutes=18),
        ]

        order_values = [
            ("O-101", "Tata Motors", "Automotive Engine Block", 450, 310, due_times[0], "M01", "On Schedule", "High", "Steel Sheet", 12, 0),
            ("O-145", "Larsen & Toubro", "Aerospace Structural Bracket", 200, 140, due_times[1], "M02", "On Schedule", "Normal", "Aluminum Plate", 18, 0),
            ("O-182", "Bharat Heavy Electricals Limited", "Turbine Housing Sheet Metal", 500, 120, due_times[2], "M03", "AT RISK (Material Delay)", "CRITICAL", "Steel Sheet Grade A", 88, 35),
            ("O-221", "Medanta Devices", "Medical Device Chassis", 800, 720, due_times[3], "M04", "On Schedule", "High", "Copper Coil", 5, 0),
            ("O-315", "Mahindra Electric", "EV Battery Tray Sub-Assembly", 350, 190, due_times[4], "M05", "On Schedule", "Normal", "Plastic Resin", 15, 0),
            ("O-401", "Hindustan Aeronautics Limited", "Aircraft Landing Gear Sleeve", 160, 42, due_times[5], "M07", "AT RISK (Machine Maintenance)", "CRITICAL", "Titanium Alloy", 76, 48),
            ("O-428", "Godrej Aerospace", "Composite Equipment Enclosure", 280, 96, due_times[6], "M08", "AT RISK (Quality Hold)", "High", "Composite Panel", 64, 22),
        ]
        orders = [
            ProductionOrderModel(
                id=order_id,
                customer=customer,
                product=product,
                quantity=quantity,
                completed_quantity=completed,
                due_at=due_at,
                current_machine=machine,
                status=order_status,
                priority=priority,
                material_name=material,
                delay_risk_score=risk,
                delay_minutes=delay,
            )
            for (
                order_id, customer, product, quantity, completed, due_at, machine,
                order_status, priority, material, risk, delay,
            ) in order_values
        ]

        materials = [
            MaterialModel(id="RM-01", name="Steel Sheet (Grade A)", stock="1,200 kg", status="Delayed by supplier (vehicle breakdown)", affected_order_id="O-182", required_qty=1500, available_qty=1200, expected_arrival=(now + timedelta(minutes=35)).isoformat(timespec="seconds")),
            MaterialModel(id="RM-02", name="Aluminum Plate (7075)", stock="2,400 kg", status="Sufficient", affected_order_id="O-145", required_qty=900, available_qty=2400),
            MaterialModel(id="RM-03", name="Copper Coil (High Purity)", stock="850 kg", status="Sufficient", affected_order_id="O-221", required_qty=500, available_qty=850),
            MaterialModel(id="RM-04", name="Polycarbonate Resin", stock="3,100 kg", status="Sufficient", affected_order_id="O-315", required_qty=1200, available_qty=3100),
            MaterialModel(id="RM-05", name="Titanium Alloy Bar", stock="420 kg", status="Available; machine under maintenance", affected_order_id="O-401", required_qty=380, available_qty=420),
            MaterialModel(id="RM-06", name="Composite Panel Grade B", stock="560 sheets", status="Quality inspection required", affected_order_id="O-428", required_qty=280, available_qty=560),
        ]

        disruption_specs = [
            ("DIS-SEED-01", "Material Delay", "CRITICAL", "O-182", "Supplier vehicle breakdown is delaying Steel Sheet delivery to M03.", "Inbound supplier vehicle breakdown", 1450000, 10),
            ("DIS-SEED-02", "Machine Breakdown", "HIGH", "O-401", "M07 is stopped for a spindle bearing inspection; its landing-gear order is paused.", "Abnormal spindle vibration detected", 980000, 28),
            ("DIS-SEED-03", "Quality Failure", "HIGH", "O-428", "A finishing sample failed the surface tolerance check; the affected batch is held for inspection.", "Surface finish exceeded approved tolerance", 625000, 42),
            ("DIS-SEED-04", "Tool Missing", "MEDIUM", "O-145", "The scheduled end mill is not available at the tool crib; an approved substitute is being checked.", "Tool inventory mismatch at shift handover", 185000, 55),
            ("DIS-SEED-05", "Supplier Delay", "MEDIUM", "O-315", "The next resin replenishment is later than planned; current stock remains available for this order.", "Supplier dispatch moved to the next route", 245000, 75),
        ]
        disruptions = [
            DisruptionEventModel(
                id=event_id,
                type=event_type,
                severity=severity,
                start_time=(now - timedelta(minutes=minutes_ago)).isoformat(timespec="seconds"),
                affected_order_id=order_id,
                description=description,
                root_cause=root_cause,
                financial_risk_inr=risk_inr,
                status="ACTIVE",
            )
            for event_id, event_type, severity, order_id, description, root_cause, risk_inr, minutes_ago in disruption_specs
        ]

        history_specs = [
            ("O-101", "EXPEDITE", 185000, 191000, 2),
            ("O-145", "RESEQUENCE", 142000, 144500, 8),
            ("O-221", "WAIT", 86000, 89500, 18),
            ("O-315", "EXPEDITE", 214000, 209000, 35),
            ("O-401", "RESEQUENCE", 325000, 338000, 62),
            ("O-182", "MOVE_TO_M06", 83000, 85500, 95),
        ]
        history = []
        for index, (order_id, action, predicted, actual, days_ago) in enumerate(history_specs, start=1):
            timestamp = now - timedelta(days=days_ago, hours=index * 2)
            error = round(abs(actual - predicted) / predicted * 100, 1)
            history.append(
                DecisionLogModel(
                    id=f"LOG-SEED-{index:02d}",
                    order_id=order_id,
                    chosen_action=action,
                    predicted_cost=predicted,
                    actual_cost=actual,
                    prediction_error=error,
                    timestamp=timestamp.isoformat(timespec="seconds"),
                    status="VERIFIED",
                )
            )

        db.add_all(machines + orders + materials + disruptions + history)
        db.commit()
        print(
            "REALRUN synthetic dataset seeded: "
            f"{len(orders)} orders, {len(machines)} machines, "
            f"{len(materials)} materials, {len(disruptions)} active disruptions, "
            f"{len(history)} historical outcomes (IST / INR)."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
