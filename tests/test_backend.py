import atexit
import os
import shutil
import tempfile
import unittest
from unittest.mock import patch

TEST_DIRECTORY = tempfile.mkdtemp(prefix="realrun-tests-")
os.environ["REALRUN_DB_PATH"] = os.path.join(TEST_DIRECTORY, "test.db")
os.environ["REALRUN_ENABLE_DEMO_RESET"] = "true"
atexit.register(shutil.rmtree, TEST_DIRECTORY, ignore_errors=True)

from fastapi.testclient import TestClient

from backend.main import app


class RealrunApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)

    def test_startup_seeds_demo_records(self):
        health = self.client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["orders"], 7)
        self.assertEqual(health.json()["machines"], 8)
        self.assertEqual(health.json()["active_disruptions"], 5)

        materials = self.client.get("/materials")
        self.assertEqual(materials.status_code, 200)
        self.assertEqual(len(materials.json()), 6)

    def test_each_seeded_case_returns_four_distinct_actions_and_recommendation(self):
        disruptions = self.client.get("/disruptions").json()
        self.assertEqual(len(disruptions), 5)
        recommendations = set()

        for event in disruptions:
            order_id = event["affected_order_id"]
            simulation = self.client.post(f"/simulate/{order_id}")
            self.assertEqual(simulation.status_code, 200, event["type"])
            scenarios = simulation.json()["scenarios"]
            self.assertEqual(len(scenarios), 4, event["type"])
            self.assertEqual(
                {scenario["action"] for scenario in scenarios},
                {"WAIT", "MOVE_TO_ALTERNATE", "EXPEDITE", "RESEQUENCE"}
                if order_id != "O-182"
                else {"WAIT", "MOVE_TO_M06", "EXPEDITE", "RESEQUENCE"},
                event["type"],
            )

            with patch("backend.main.generate_explanation", return_value={"source": "test"}):
                recommendation = self.client.post(f"/recommend/{order_id}")
            self.assertEqual(recommendation.status_code, 200, event["type"])
            result = recommendation.json()["recommendation"]
            recommendations.add(result["recommended_action"])
            self.assertTrue(result["is_advisory"])
            self.assertIn("Uncalibrated", result["confidence_level"])

        self.assertGreaterEqual(len(recommendations), 3)

    def test_reset_requires_explicit_opt_in_and_reseeds_only_test_database(self):
        os.environ.pop("REALRUN_ENABLE_DEMO_RESET", None)
        response = self.client.post("/reset-demo")
        self.assertEqual(response.status_code, 403)

        os.environ["REALRUN_ENABLE_DEMO_RESET"] = "true"
        response = self.client.post("/reset-demo")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "RESET_SUCCESSFUL")
        self.assertEqual(self.client.get("/health").json()["orders"], 7)


if __name__ == "__main__":
    unittest.main()
