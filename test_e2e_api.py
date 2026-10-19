import json
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_api_flow():
    print("=== Starting Full E2E API Flow Verification ===")

    # 1. Signup / Login
    user_email = f"e2e_user_{int(time.time())}@leadgen.ai"
    print(f"1. Registering user: {user_email}")
    signup_res = client.post("/signup", json={
        "name": "E2E LeadGen Tester",
        "email": user_email,
        "phone": "+1 (555) 234-5678",
        "password": "SecurePassword2026!"
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(" - Signup successful. Token acquired.")

    # 2. Get User Profile
    print("2. Fetching user profile /users/me...")
    me_res = client.get("/users/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    print(" - Current user:", user_data["name"], "| Active Workspace:", user_data["current_workspace_name"])

    # 3. Workspaces
    print("3. Testing Workspaces CRUD...")
    ws_list_res = client.get("/api/v1/workspaces", headers=headers)
    assert ws_list_res.status_code == 200
    workspaces = ws_list_res.json()
    assert len(workspaces) >= 1
    print(f" - Found {len(workspaces)} workspace(s).")

    # Create second workspace
    create_ws_res = client.post("/api/v1/workspaces", json={"name": "Global Enterprise Team"}, headers=headers)
    assert create_ws_res.status_code == 200
    new_ws = create_ws_res.json()
    print(" - Created new workspace:", new_ws["name"])

    # Switch workspace
    switch_res = client.post(f"/api/v1/workspaces/switch/{new_ws['id']}", headers=headers)
    assert switch_res.status_code == 200
    print(" - Switched active workspace to:", new_ws["id"])

    # 4. Deliverability Engine
    print("4. Testing Deliverability Verification Route...")
    deliv_res = client.post("/api/v1/deliverability/verify", json={"email": "sarah.connor@cyberdyne.systems"}, headers=headers)
    assert deliv_res.status_code == 200
    deliv_data = deliv_res.json()
    assert deliv_data["syntax_valid"] is True
    print(" - Deliverability verification result:", deliv_data["status"], "| Score:", deliv_data["deliverability_score"])

    # 5. SMTP Settings & Connection Test (Simulation Host)
    print("5. Testing SMTP & Outbound Email Settings...")
    smtp_save_res = client.post("/api/v1/email/settings", json={
        "host": "dummy.smtp.server",
        "port": 587,
        "username": "postmaster@leadgen-test.mailgun.org",
        "password": "sample_secret_key",
        "use_tls": True,
        "use_ssl": False,
        "from_name": "Sarah Connor",
        "from_email": "sarah@cyberdyne.systems",
        "is_active": True
    }, headers=headers)
    assert smtp_save_res.status_code == 200
    print(" - SMTP Settings saved successfully.")

    # Test SMTP simulation dispatch
    print("6. Testing Direct Email Dispatch...")
    dispatch_res = client.post("/api/v1/email/dispatch", json={
        "recipient_email": "prospect_ceo@targetcorp.io",
        "recipient_name": "Target CEO",
        "subject": "Scaling outbound pipeline",
        "body": "Hi there, we have qualified insights for your sales team.",
        "step_number": 1,
        "tone": "Professional & Consultative"
    }, headers=headers)
    assert dispatch_res.status_code == 200
    dispatch_data = dispatch_res.json()
    assert dispatch_data["success"] is True and dispatch_data["simulated"] is True
    print(" - Direct email dispatch response:", dispatch_data["message"])

    # Check logs
    logs_res = client.get("/api/v1/email/logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    print(f" - Outbound dispatch logs recorded ({len(logs)} entry).")

    # 7. Dashboard Stats
    print("7. Testing Dashboard Stats API...")
    stats_res = client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(" - Dashboard KPIs:", {
        "total_leads": stats["total_leads"],
        "emails_dispatched": stats["emails_dispatched"],
        "workspace_name": stats["workspace_name"]
    })

    # 8. History & CRM Export Check
    print("8. Testing History endpoints...")
    hist_res = client.get("/api/v1/history", headers=headers)
    assert hist_res.status_code == 200
    print(" - History listing works cleanly.")

    print("\n>>> ALL E2E API INTEGRATION TESTS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    test_full_api_flow()
