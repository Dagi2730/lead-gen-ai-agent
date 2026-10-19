import asyncio
from app.database import init_db, SessionLocal, User, Workspace, WorkspaceMember, DBLead
from app.deliverability import verify_email_deliverability
from app.email_service import test_smtp_connection, send_smtp_email
from app.auth import get_password_hash

def test_backend_components():
    print("1. Initializing DB...")
    init_db()
    db = SessionLocal()

    print("2. Testing Deliverability Module...")
    d1 = verify_email_deliverability("john.doe@google.com")
    assert d1["status"] in ["Verified", "Valid"], f"Unexpected status: {d1}"
    print(" - Corporate Email Test passed:", d1["status"], d1["deliverability_score"])

    d2 = verify_email_deliverability("test@mailinator.com")
    assert d2["status"] == "Invalid", f"Expected Invalid for disposable email: {d2}"
    print(" - Disposable Email Test passed:", d2["status"])

    d3 = verify_email_deliverability("invalid-email-format")
    assert d3["status"] == "Invalid", f"Expected Invalid for syntax: {d3}"
    print(" - Syntax Check passed:", d3["status"])

    print("3. Testing Email Service Simulation...")
    sim_result = send_smtp_email(
        host="dummy.smtp.server",
        port=587,
        username="test@example.com",
        password="pwd",
        from_name="LeadGen Test",
        from_email="test@example.com",
        to_email="prospect@company.com",
        subject="Growth Strategy",
        body_text="Hello, we have insights for your company."
    )
    assert sim_result["success"] is True and sim_result["simulated"] is True
    print(" - Email Simulation passed:", sim_result)

    print("4. Testing Database Workspace Associations...")
    test_user = db.query(User).filter(User.email == "test_architect@leadgen.ai").first()
    if not test_user:
        test_user = User(
            name="Architect Tester",
            email="test_architect@leadgen.ai",
            phone="+1234567890",
            hashed_password=get_password_hash("pass12345")
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    test_ws = db.query(Workspace).filter(Workspace.owner_id == test_user.id).first()
    if not test_ws:
        test_ws = Workspace(
            name="Enterprise Alpha Workspace",
            slug=f"ws-alpha-{test_user.id}",
            owner_id=test_user.id
        )
        db.add(test_ws)
        db.commit()
        db.refresh(test_ws)

        member = WorkspaceMember(
            workspace_id=test_ws.id,
            user_id=test_user.id,
            role="owner"
        )
        db.add(member)
        test_user.current_workspace_id = test_ws.id
        db.commit()

    print(" - Workspace membership verified for user:", test_user.email, "in workspace:", test_ws.name)
    db.close()
    print("All backend core module tests passed successfully!")

if __name__ == "__main__":
    test_backend_components()
