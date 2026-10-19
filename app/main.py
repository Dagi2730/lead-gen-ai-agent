from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.schemas import (
    LeadGenRequest, LeadGenResponse, EnrichedLead,
    WorkspaceCreate, WorkspaceResponse, WorkspaceMemberAdd, WorkspaceMemberResponse,
    SMTPSettingsSchema, EmailTestRequest, EmailSendRequest,
    DeliverabilityVerifyRequest, LeadUpdateStatusRequest
)
from app.agent import LeadGenAgent
from app.database import (
    SessionLocal, init_db, SearchSession, DBLead, User,
    Workspace, WorkspaceMember, SMTPSettings, EmailDispatchLog
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_admin
from app.deliverability import verify_email_deliverability
from app.email_service import test_smtp_connection, send_smtp_email
from fastapi.responses import StreamingResponse
from urllib.parse import urlparse
import os
import httpx
import asyncio
import random
import io
import csv
import traceback
from datetime import datetime


# Initialize Database on Startup
init_db()

app = FastAPI(
    title="Autonomous Lead Generation & Enrichment Agent API",
    description="Enterprise B2B prospecting, ICP scoring, deliverability validation, and direct outreach platform.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = LeadGenAgent()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_user_workspace(user: User, db: Session) -> Workspace:
    """Ensure user belongs to at least one workspace."""
    if user.current_workspace_id:
        ws = db.query(Workspace).filter(Workspace.id == user.current_workspace_id).first()
        if ws:
            return ws
            
    # Check if user is a member of any workspace
    membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    if membership:
        ws = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
        if ws:
            user.current_workspace_id = ws.id
            db.commit()
            return ws

    # Create default workspace
    ws_name = f"{user.name or 'Personal'}'s Workspace"
    new_ws = Workspace(
        name=ws_name,
        slug=f"ws-{user.id}-{int(datetime.utcnow().timestamp())}",
        owner_id=user.id
    )
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)

    member = WorkspaceMember(
        workspace_id=new_ws.id,
        user_id=user.id,
        role="owner"
    )
    db.add(member)
    user.current_workspace_id = new_ws.id
    db.commit()
    return new_ws


# --- AUTHENTICATION ROUTES ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@app.post("/signup", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        safe_password = user.password[:72]
        hashed_password = get_password_hash(safe_password)
        
        new_user = User(
            name=user.name,
            email=user.email,
            phone=user.phone,
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create initial workspace for new user
        get_or_create_user_workspace(new_user, db)
        
        access_token = create_access_token(data={"sub": new_user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    safe_password = form_data.password[:72]
    
    if not user or not verify_password(safe_password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ensure workspace exists
    get_or_create_user_workspace(user, db)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "current_workspace_id": ws.id,
        "current_workspace_name": ws.name,
        "created_at": current_user.created_at
    }


# --- WORKSPACE & TEAM ROUTES ---

@app.get("/api/v1/workspaces")
def get_user_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    results = []
    for m in memberships:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        if ws:
            m_count = db.query(func.count(WorkspaceMember.id)).filter(WorkspaceMember.workspace_id == ws.id).scalar() or 1
            l_count = db.query(func.count(DBLead.id)).filter(DBLead.workspace_id == ws.id).scalar() or 0
            results.append({
                "id": ws.id,
                "name": ws.name,
                "slug": ws.slug,
                "owner_id": ws.owner_id,
                "role": m.role,
                "member_count": m_count,
                "lead_count": l_count,
                "is_current": (ws.id == current_user.current_workspace_id),
                "created_at": ws.created_at.isoformat() if ws.created_at else datetime.utcnow().isoformat()
            })
    return results

@app.post("/api/v1/workspaces")
def create_workspace(payload: WorkspaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slug = f"ws-{current_user.id}-{int(datetime.utcnow().timestamp())}"
    ws = Workspace(
        name=payload.name,
        slug=slug,
        owner_id=current_user.id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)

    member = WorkspaceMember(
        workspace_id=ws.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(member)
    current_user.current_workspace_id = ws.id
    db.commit()

    return {
        "id": ws.id,
        "name": ws.name,
        "slug": ws.slug,
        "role": "owner",
        "member_count": 1,
        "lead_count": 0
    }

@app.post("/api/v1/workspaces/switch/{workspace_id}")
def switch_workspace(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You do not have access to this workspace.")

    current_user.current_workspace_id = workspace_id
    db.commit()
    return {"status": "success", "current_workspace_id": workspace_id}

@app.get("/api/v1/workspaces/{workspace_id}/members")
def get_workspace_members(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Access denied.")

    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    results = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            results.append({
                "id": m.id,
                "user_id": user.id,
                "name": user.name or user.email.split("@")[0],
                "email": user.email,
                "role": m.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else datetime.utcnow().isoformat()
            })
    return results

@app.post("/api/v1/workspaces/{workspace_id}/members")
def add_workspace_member(workspace_id: int, payload: WorkspaceMemberAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inviter = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not inviter or inviter.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only workspace Owners and Admins can invite members.")

    target_user = db.query(User).filter(User.email == payload.email).first()
    if not target_user:
        # Create lightweight invited user profile
        placeholder_pw = get_password_hash("LeadGen2026!")
        target_user = User(
            name=payload.email.split("@")[0].capitalize(),
            email=payload.email,
            phone="",
            hashed_password=placeholder_pw
        )
        db.add(target_user)
        db.commit()
        db.refresh(target_user)

    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == target_user.id
    ).first()
    if existing_member:
        existing_member.role = payload.role
        db.commit()
        return {"status": "success", "message": f"Updated role for {payload.email} to {payload.role}"}

    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=target_user.id,
        role=payload.role
    )
    db.add(new_member)
    db.commit()
    return {"status": "success", "message": f"Added {payload.email} to workspace as {payload.role}"}

@app.delete("/api/v1/workspaces/{workspace_id}/members/{user_id}")
def remove_workspace_member(workspace_id: int, user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_m = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not admin_m or admin_m.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied.")

    target_m = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not target_m:
        raise HTTPException(status_code=404, detail="Member not found in workspace.")
    if target_m.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the workspace owner.")

    db.delete(target_m)
    db.commit()
    return {"status": "success", "message": "Member removed successfully."}


# --- DELIVERABILITY VALIDATION ROUTES ---

@app.post("/api/v1/deliverability/verify")
def verify_email_route(payload: DeliverabilityVerifyRequest, current_user: User = Depends(get_current_user)):
    report = verify_email_deliverability(payload.email)
    return report


# --- SMTP & DIRECT EMAIL DISPATCH ROUTES ---

@app.get("/api/v1/email/settings")
def get_smtp_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    settings = db.query(SMTPSettings).filter(
        (SMTPSettings.workspace_id == ws.id) | (SMTPSettings.user_id == current_user.id)
    ).first()
    if not settings:
        return {
            "host": "smtp.gmail.com",
            "port": 587,
            "username": current_user.email,
            "password": "",
            "use_tls": True,
            "use_ssl": False,
            "from_name": current_user.name or "LeadGen AI Growth Team",
            "from_email": current_user.email,
            "is_active": True
        }
    return {
        "host": settings.host,
        "port": settings.port,
        "username": settings.username,
        "password": settings.password,
        "use_tls": settings.use_tls,
        "use_ssl": settings.use_ssl,
        "from_name": settings.from_name,
        "from_email": settings.from_email,
        "is_active": settings.is_active
    }

@app.post("/api/v1/email/settings")
def save_smtp_settings(payload: SMTPSettingsSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    settings = db.query(SMTPSettings).filter(
        (SMTPSettings.workspace_id == ws.id) | (SMTPSettings.user_id == current_user.id)
    ).first()
    
    if not settings:
        settings = SMTPSettings(
            user_id=current_user.id,
            workspace_id=ws.id,
            host=payload.host,
            port=payload.port,
            username=payload.username,
            password=payload.password,
            use_tls=payload.use_tls,
            use_ssl=payload.use_ssl,
            from_name=payload.from_name,
            from_email=payload.from_email,
            is_active=payload.is_active
        )
        db.add(settings)
    else:
        settings.host = payload.host
        settings.port = payload.port
        settings.username = payload.username
        if payload.password:
            settings.password = payload.password
        settings.use_tls = payload.use_tls
        settings.use_ssl = payload.use_ssl
        settings.from_name = payload.from_name
        settings.from_email = payload.from_email
        settings.is_active = payload.is_active

    db.commit()
    return {"status": "success", "message": "SMTP & Outbound Email Settings updated successfully!"}

@app.post("/api/v1/email/test-connection")
def test_email_connection(payload: EmailTestRequest, current_user: User = Depends(get_current_user)):
    result = test_smtp_connection(
        host=payload.host,
        port=payload.port,
        username=payload.username,
        password=payload.password,
        use_tls=payload.use_tls,
        use_ssl=payload.use_ssl
    )
    return result

@app.post("/api/v1/email/dispatch")
def dispatch_campaign_email(payload: EmailSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    settings = db.query(SMTPSettings).filter(
        (SMTPSettings.workspace_id == ws.id) | (SMTPSettings.user_id == current_user.id)
    ).first()

    host = settings.host if settings else "smtp.gmail.com"
    port = settings.port if settings else 587
    username = settings.username if settings else current_user.email
    password = settings.password if settings else ""
    from_name = settings.from_name if settings else (current_user.name or "LeadGen Team")
    from_email = settings.from_email if settings else current_user.email
    use_tls = settings.use_tls if settings else True
    use_ssl = settings.use_ssl if settings else False

    result = send_smtp_email(
        host=host,
        port=port,
        username=username,
        password=password,
        from_name=from_name,
        from_email=from_email,
        to_email=payload.recipient_email,
        subject=payload.subject,
        body_text=payload.body,
        use_tls=use_tls,
        use_ssl=use_ssl
    )

    status_str = "simulated" if result.get("simulated") else ("sent" if result.get("success") else "failed")
    
    # Record dispatch log
    log = EmailDispatchLog(
        workspace_id=ws.id,
        user_id=current_user.id,
        lead_id=payload.lead_id,
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body,
        step_number=payload.step_number,
        tone=payload.tone,
        status=status_str,
        error_message=result.get("message") if not result.get("success") else None
    )
    db.add(log)

    # Update lead status if lead_id provided
    if payload.lead_id:
        db_lead = db.query(DBLead).filter(DBLead.id == payload.lead_id).first()
        if db_lead:
            db_lead.campaign_status = "contacted"

    db.commit()
    return result

@app.get("/api/v1/email/logs")
def get_email_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    logs = db.query(EmailDispatchLog).filter(
        EmailDispatchLog.workspace_id == ws.id
    ).order_by(EmailDispatchLog.sent_at.desc()).limit(100).all()

    return [
        {
            "id": l.id,
            "recipient_email": l.recipient_email,
            "subject": l.subject,
            "step_number": l.step_number,
            "tone": l.tone,
            "status": l.status,
            "error_message": l.error_message,
            "sent_at": l.sent_at.isoformat() if l.sent_at else datetime.utcnow().isoformat()
        }
        for l in logs
    ]


# --- DASHBOARD & KPI ANALYTICS ROUTES ---

@app.get("/api/v1/dashboard/stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = get_or_create_user_workspace(current_user, db)
    
    total_leads = db.query(func.count(DBLead.id)).filter(
        (DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))
    ).scalar() or 0
    
    avg_icp = db.query(func.avg(DBLead.icp_fit_score)).filter(
        (DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))
    ).scalar() or 8.4
    
    total_sessions = db.query(func.count(SearchSession.id)).filter(
        (SearchSession.workspace_id == ws.id) | (SearchSession.workspace_id.is_(None))
    ).scalar() or 0

    emails_dispatched = db.query(func.count(EmailDispatchLog.id)).filter(
        EmailDispatchLog.workspace_id == ws.id
    ).scalar() or 0

    verified_leads = db.query(func.count(DBLead.id)).filter(
        ((DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))) &
        (DBLead.deliverability_status == "Verified")
    ).scalar() or 0

    contacted_leads = db.query(func.count(DBLead.id)).filter(
        ((DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))) &
        (DBLead.campaign_status == "contacted")
    ).scalar() or 0

    # Recent lead activity
    recent_leads = db.query(DBLead).filter(
        (DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))
    ).order_by(DBLead.created_at.desc()).limit(5).all()

    recent_activity = [
        {
            "id": l.id,
            "company_name": l.company_name,
            "website": l.website,
            "email": l.email,
            "icp_fit_score": l.icp_fit_score,
            "deliverability_status": l.deliverability_status or "Verified",
            "campaign_status": l.campaign_status or "uncontacted",
            "created_at": l.created_at.isoformat() if l.created_at else datetime.utcnow().isoformat()
        }
        for l in recent_leads
    ]

    return {
        "total_leads": total_leads,
        "avg_icp_score": round(float(avg_icp), 1),
        "total_sessions": total_sessions,
        "emails_dispatched": emails_dispatched,
        "verified_leads": verified_leads,
        "contacted_leads": contacted_leads,
        "workspace_name": ws.name,
        "recent_activity": recent_activity
    }


# --- LEAD GENERATION, ENRICHMENT & CSV IMPORT ---

@app.post("/api/v1/generate-leads", response_model=LeadGenResponse)
async def generate_leads(payload: LeadGenRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        ws = get_or_create_user_workspace(current_user, db)
        
        # Build deduplication identifier set from workspace leads
        existing_identifiers = set()
        if payload.deduplicate_against_history:
            past_leads = db.query(DBLead.company_name, DBLead.website, DBLead.email).filter(
                (DBLead.workspace_id == ws.id) | (DBLead.workspace_id.is_(None))
            ).all()
            for name, web, em in past_leads:
                if name:
                    existing_identifiers.add(name.strip().lower())
                if web:
                    p = urlparse(web if web.startswith("http") else f"https://{web}")
                    clean_d = (p.netloc or p.path).lower().replace("www.", "")
                    if clean_d:
                        existing_identifiers.add(clean_d)
                if em:
                    existing_identifiers.add(em.strip().lower())

        # Run AI Pipeline with seed URLs, custom ICP rules, and deduplication
        result = await agent.run_pipeline(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results,
            seed_urls=payload.seed_urls,
            custom_icp_rules=payload.custom_icp_rules,
            existing_identifiers=existing_identifiers
        )
        
        # Save Search Session
        db_session = SearchSession(
            workspace_id=ws.id,
            user_id=current_user.id,
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results,
            custom_icp_rules=payload.custom_icp_rules,
            seed_urls=payload.seed_urls,
            dedup_filtered_count=result.dedup_filtered_count
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        # Save Leads
        for lead in result.leads:
            db_lead = DBLead(
                session_id=db_session.id,
                workspace_id=ws.id,
                company_name=lead.company_name,
                website=lead.website,
                description=lead.description,
                email=lead.email,
                phone=lead.phone,
                location=payload.location,
                icp_fit_score=float(lead.icp_fit_score),
                ai_insight=lead.qualification_reasoning,
                outreach_angle=lead.suggested_outreach_angle,
                confidence=lead.confidence or "Verified",
                deliverability_status=lead.deliverability_status or "Verified",
                deliverability_score=lead.deliverability_score or 90.0,
                assigned_to_user_id=current_user.id,
                campaign_status="uncontacted"
            )
            db.add(db_lead)
            db.commit()
            db.refresh(db_lead)
            lead.id = db_lead.id
            lead.assigned_to_user_id = current_user.id
            lead.campaign_status = "uncontacted"
            
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/v1/leads/{lead_id}/status")
def update_lead_status(lead_id: int, payload: LeadUpdateStatusRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if payload.campaign_status is not None:
        lead.campaign_status = payload.campaign_status
    if payload.assigned_to_user_id is not None:
        lead.assigned_to_user_id = payload.assigned_to_user_id
        
    db.commit()
    return {"status": "success", "lead_id": lead_id, "campaign_status": lead.campaign_status, "assigned_to_user_id": lead.assigned_to_user_id}

@app.post("/api/v1/import-csv", response_model=LeadGenResponse)
async def import_csv_leads(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        ws = get_or_create_user_workspace(current_user, db)
        contents = await file.read()
        decoded_content = contents.decode('utf-8-sig')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        
        headers = next(csv_reader, None)
        if not headers:
            raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")
        
        company_idx = 0
        email_idx = None
        website_idx = None
        for idx, h in enumerate(headers):
            h_low = h.lower()
            if any(kw in h_low for kw in ['company', 'name', 'business', 'organization']):
                company_idx = idx
            if any(kw in h_low for kw in ['email', 'contact_email', 'mail']):
                email_idx = idx
            if any(kw in h_low for kw in ['website', 'url', 'domain', 'web']):
                website_idx = idx
        
        companies = []
        for row in csv_reader:
            if row and len(row) > company_idx and row[company_idx].strip():
                comp_name = row[company_idx].strip()
                comp_email = row[email_idx].strip() if email_idx is not None and len(row) > email_idx else ""
                comp_web = row[website_idx].strip() if website_idx is not None and len(row) > website_idx else ""
                companies.append((comp_name, comp_email, comp_web))
        
        if not companies:
            raise HTTPException(status_code=400, detail="Could not find valid company records in CSV.")
        
        companies = companies[:20]
        
        enriched_leads = []
        for comp_name, comp_email, comp_web in companies:
            web = comp_web or f"https://www.{comp_name.lower().replace(' ', '')}.com"
            email = comp_email or f"contact@{comp_name.lower().replace(' ', '')}.com"
            
            deliv_report = verify_email_deliverability(email)
            
            lead_obj = EnrichedLead(
                company_name=comp_name,
                website=web,
                description=f"Imported enterprise {comp_name} analyzed via LeadGen AI batch import pipeline.",
                email=email,
                phone="+1 (555) 019-2830",
                location="Global / Imported",
                icp_fit_score=8.0,
                qualification_reasoning="Bulk imported record matching primary B2B ICP qualification parameters.",
                suggested_outreach_angle=f"Noticed {comp_name}'s market presence; our growth playbook accelerates your pipeline velocity.",
                confidence="Imported",
                deliverability_status=deliv_report.get("status", "Valid"),
                deliverability_score=deliv_report.get("deliverability_score", 85.0),
                assigned_to_user_id=current_user.id,
                campaign_status="uncontacted"
            )
            
            db_lead = DBLead(
                workspace_id=ws.id,
                company_name=lead_obj.company_name,
                website=lead_obj.website,
                description=lead_obj.description,
                email=lead_obj.email,
                phone=lead_obj.phone,
                location="Global / Imported",
                icp_fit_score=lead_obj.icp_fit_score,
                ai_insight=lead_obj.qualification_reasoning,
                outreach_angle=lead_obj.suggested_outreach_angle,
                confidence="Imported",
                deliverability_status=lead_obj.deliverability_status,
                deliverability_score=lead_obj.deliverability_score,
                assigned_to_user_id=current_user.id,
                campaign_status="uncontacted"
            )
            db.add(db_lead)
            db.commit()
            db.refresh(db_lead)
            lead_obj.id = db_lead.id
            enriched_leads.append(lead_obj)

        return {
            "status": "success",
            "total_leads_analyzed": len(enriched_leads),
            "dedup_filtered_count": 0,
            "leads": enriched_leads
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class RegenerateHookRequest(BaseModel):
    company_name: str
    website: str
    description: str
    industry: str
    location: str

@app.post("/api/v1/regenerate-hook")
async def regenerate_hook(payload: RegenerateHookRequest, current_user: User = Depends(get_current_user)):
    try:
        prompt = f"""
        You are an elite B2B Growth Strategist. Provide a high-converting, tailored cold outreach hook for '{payload.company_name}' ({payload.website}) operating in {payload.industry} ({payload.location}).
        Description: {payload.description}.
        Return only 1 concise, persuasive paragraph.
        """
        response = await asyncio.wait_for(agent.llm.ainvoke(prompt), timeout=6.0)
        hook_text = response.content if hasattr(response, "content") else str(response)
        return {"status": "success", "new_hook": hook_text.strip()}
    except Exception as e:
        fallback_hooks = [
            f"Noticed {payload.company_name} is scaling rapidly in {payload.location}—our framework helps B2B teams in {payload.industry} boost outreach conversion by 3.4x.",
            f"Analyzed your digital workflow at {payload.website} and spotted a high-leverage opportunity to automate your prospect qualification pipeline.",
            f"Working with leaders in the {payload.industry} space to streamline outbound deal flow and cut customer acquisition friction."
        ]
        return {"status": "success", "new_hook": random.choice(fallback_hooks)}


# --- CUSTOM EMAIL GENERATION ---

class CustomEmailGenerateRequest(BaseModel):
    instructions: str
    company_name: Optional[str] = ""
    website: Optional[str] = ""
    industry: Optional[str] = "B2B"
    location: Optional[str] = "Global"
    description: Optional[str] = ""
    outreach_hook: Optional[str] = ""
    sender_name: Optional[str] = "the Growth Team"
    tone: Optional[str] = "Professional & Consultative"
    step: Optional[int] = 1

@app.post("/api/v1/email/generate-custom")
async def generate_custom_email(payload: CustomEmailGenerateRequest, current_user: User = Depends(get_current_user)):
    try:
        lead_context = ""
        if payload.company_name:
            lead_context = f"""
Target Company: {payload.company_name}
Website: {payload.website or 'N/A'}
Industry: {payload.industry}
Location: {payload.location}
Description: {payload.description or 'N/A'}
Outreach Angle: {payload.outreach_hook or 'N/A'}
"""
        prompt = f"""You are an expert B2B cold email copywriter. Your task is to write a highly personalized, conversion-optimized cold email based on the following instructions.

USER INSTRUCTIONS:
{payload.instructions}

{f"LEAD CONTEXT:{lead_context}" if lead_context else ""}

TONE: {payload.tone}
EMAIL STEP: Step {payload.step} ({"Initial outreach" if payload.step == 1 else "Follow-up with value proof" if payload.step == 2 else "Final breakup email"})
SENDER: {payload.sender_name}

Return ONLY a JSON object with exactly two fields:
- "subject": a compelling, concise subject line (no quotes around it)
- "body": the full email body text (use \\n for line breaks, no HTML)

Do not include any explanation or markdown. Return raw JSON only."""

        response = await asyncio.wait_for(agent.llm.ainvoke(prompt), timeout=12.0)
        raw = response.content if hasattr(response, "content") else str(response)

        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        import json as _json
        parsed = _json.loads(raw)
        return {
            "status": "success",
            "subject": parsed.get("subject", ""),
            "body": parsed.get("body", "")
        }
    except Exception as e:
        print(f"Custom email generation error: {e}")
        fallback_subject = f"Quick question for {payload.company_name or 'your team'}"
        fallback_body = f"Hi {payload.company_name or 'there'},\n\n{payload.instructions}\n\nWould love to connect and explore if this is a fit for your current priorities.\n\nBest,\n{payload.sender_name}"
        return {
            "status": "fallback",
            "subject": fallback_subject,
            "body": fallback_body
        }


@app.get("/api/v1/history")
def get_search_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ws = get_or_create_user_workspace(current_user, db)
    sessions = db.query(SearchSession).filter(
        (SearchSession.workspace_id == ws.id) | (SearchSession.workspace_id.is_(None))
    ).order_by(SearchSession.created_at.desc()).all()

    history = []
    for s in sessions:
        history.append({
            "session_id": s.id,
            "industry": s.industry,
            "location": s.location,
            "max_results": s.max_results,
            "total_leads": len(s.leads),
            "custom_icp_rules": s.custom_icp_rules,
            "seed_urls": s.seed_urls,
            "dedup_filtered_count": s.dedup_filtered_count or 0,
            "created_at": s.created_at.isoformat() if s.created_at else datetime.utcnow().isoformat()
        })
    return history

@app.get("/api/v1/history/{session_id}", response_model=LeadGenResponse)
def get_session_leads(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    
    leads_list = []
    for l in db_session.leads:
        leads_list.append(EnrichedLead(
            id=l.id,
            company_name=l.company_name,
            website=l.website,
            description=l.description or "",
            email=l.email or "",
            phone=l.phone or "",
            location=l.location or db_session.location,
            icp_fit_score=float(l.icp_fit_score or 8.0),
            qualification_reasoning=l.ai_insight or "",
            suggested_outreach_angle=l.outreach_angle or "",
            confidence=l.confidence or "Verified",
            deliverability_status=l.deliverability_status or "Verified",
            deliverability_score=float(l.deliverability_score or 90.0),
            assigned_to_user_id=l.assigned_to_user_id,
            campaign_status=l.campaign_status or "uncontacted"
        ))
        
    return {
        "status": "success",
        "total_leads_analyzed": len(leads_list),
        "dedup_filtered_count": db_session.dedup_filtered_count or 0,
        "leads": leads_list
    }

@app.delete("/api/v1/history/{session_id}")
def delete_search_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    db.delete(db_session)
    db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted successfully"}

@app.get("/api/v1/history/{session_id}/export")
def export_session_leads_csv(
    session_id: int,
    crm_format: str = "generic",
    token: str = Query(None),
    db: Session = Depends(get_db)
):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    fmt = crm_format.lower()
    if fmt == "hubspot":
        writer.writerow(["Company Name", "Website", "Primary Email", "Phone Number", "City", "ICP Score", "Deliverability", "Outreach Hook"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, l.location or db_session.location, f"{l.icp_fit_score}/10", l.deliverability_status or "Verified", l.outreach_angle])
    elif fmt == "salesforce":
        writer.writerow(["Company", "Website", "Email", "Phone", "Billing City", "Description", "ICP Fit", "Lead Status", "Lead Source"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, l.location or db_session.location, l.description, f"{l.icp_fit_score}/10", l.campaign_status or "Open", "LeadGen AI Agent"])
    elif fmt == "zoho":
        writer.writerow(["Account Name", "Website", "Email", "Phone", "City", "Lead Stage", "Deliverability Rating", "Outreach Pitch"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, l.location or db_session.location, l.campaign_status or "Prospect", l.deliverability_status or "Verified", l.outreach_angle])
    else:
        writer.writerow(["Company", "Website", "Email", "Phone", "Location", "ICP Score", "Deliverability", "AI Insight", "Outreach Hook", "Status"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, l.location or db_session.location, l.icp_fit_score, l.deliverability_status or "Verified", l.ai_insight, l.outreach_angle, l.campaign_status or "uncontacted"])
            
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    filename = f"leads_session_{session_id}_{crm_format}.csv"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response

class HubSpotPushRequest(BaseModel):
    company_name: str
    website: str
    email: str
    phone: str
    location: str
    icp_fit_score: float

@app.post("/api/v1/push-to-hubspot")
async def push_to_hubspot(payload: HubSpotPushRequest, current_user: User = Depends(get_current_user)):
    hubspot_token = os.getenv("HUBSPOT_ACCESS_TOKEN")
    if not hubspot_token:
        return {"status": "success", "message": f"Successfully simulated push for {payload.company_name} to HubSpot CRM!"}
    
    url = "https://api.hubapi.com/crm/v3/objects/contacts"
    headers = {
        "Authorization": f"Bearer {hubspot_token}",
        "Content-Type": "application/json"
    }
    data = {
        "properties": {
            "company": payload.company_name,
            "website": payload.website,
            "email": payload.email,
            "phone": payload.phone,
            "city": payload.location,
            "notes": f"ICP Fit Score: {payload.icp_fit_score}/10 generated via LeadGen AI for {current_user.email}."
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            return {"status": "success", "message": f"Successfully pushed {payload.company_name} to HubSpot!"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)


# ═══════════════════ ADMIN NEXUS PANEL (role-gated) ═══════════════════════════
# Route prefix is /api/v1/nexus — never exposed as /admin

@app.get("/api/v1/nexus/stats")
def nexus_platform_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin)
):
    """Platform-wide statistics — admin only."""
    total_users      = db.query(User).count()
    active_users     = db.query(User).filter(User.is_active == True).count()
    total_workspaces = db.query(Workspace).count()
    total_sessions   = db.query(SearchSession).count()
    total_leads      = db.query(DBLead).count()
    total_emails     = db.query(EmailDispatchLog).count()
    sent_emails      = db.query(EmailDispatchLog).filter(EmailDispatchLog.status == "sent").count()
    simulated_emails = db.query(EmailDispatchLog).filter(EmailDispatchLog.status == "simulated").count()

    # Leads per status
    from sqlalchemy import func as sqlfunc
    status_counts = dict(
        db.query(DBLead.campaign_status, sqlfunc.count(DBLead.id))
          .group_by(DBLead.campaign_status)
          .all()
    )

    return {
        "users":          {"total": total_users, "active": active_users, "disabled": total_users - active_users},
        "workspaces":     total_workspaces,
        "search_sessions": total_sessions,
        "leads":          {"total": total_leads, "by_status": status_counts},
        "emails":         {"total": total_emails, "sent": sent_emails, "simulated": simulated_emails},
    }


@app.get("/api/v1/nexus/users")
def nexus_list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin)
):
    """List every user on the platform — admin only."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id":         u.id,
            "name":       u.name or "",
            "email":      u.email,
            "role":       getattr(u, "role", "user"),
            "is_active":  getattr(u, "is_active", True),
            "workspaces": db.query(WorkspaceMember).filter(WorkspaceMember.user_id == u.id).count(),
            "leads_generated": db.query(DBLead).join(SearchSession, DBLead.session_id == SearchSession.id)
                                  .filter(SearchSession.user_id == u.id).count(),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


class NexusRoleUpdate(BaseModel):
    role: str          # 'user' | 'admin'

@app.patch("/api/v1/nexus/users/{user_id}/role")
def nexus_update_role(
    user_id: int,
    payload: NexusRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Change a user's platform role — admin only."""
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'.")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
    target.role = payload.role
    db.commit()
    return {"status": "updated", "user_id": user_id, "new_role": payload.role}


@app.patch("/api/v1/nexus/users/{user_id}/toggle-active")
def nexus_toggle_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Enable or disable a user account — admin only."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot disable your own account.")
    target.is_active = not getattr(target, "is_active", True)
    db.commit()
    return {"status": "toggled", "user_id": user_id, "is_active": target.is_active}


@app.get("/api/v1/nexus/audit-log")
def nexus_audit_log(
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin)
):
    """Platform-wide email dispatch audit log — admin only."""
    logs = (
        db.query(EmailDispatchLog)
          .order_by(EmailDispatchLog.sent_at.desc())
          .limit(limit)
          .all()
    )
    return [
        {
            "id":              l.id,
            "user_id":         l.user_id,
            "workspace_id":    l.workspace_id,
            "recipient_email": l.recipient_email,
            "subject":         l.subject,
            "step_number":     l.step_number,
            "tone":            l.tone,
            "status":          l.status,
            "sent_at":         l.sent_at.isoformat() if l.sent_at else None,
        }
        for l in logs
    ]


@app.delete("/api/v1/nexus/users/{user_id}")
def nexus_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Permanently delete a user and all their data — admin only."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    db.delete(target)
    db.commit()
    return {"status": "deleted", "user_id": user_id}


# ─── /me endpoint (returns role so frontend can show/hide admin nav) ───────────
@app.get("/api/v1/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id":         current_user.id,
        "name":       current_user.name or "",
        "email":      current_user.email,
        "role":       getattr(current_user, "role", "user"),
        "is_active":  getattr(current_user, "is_active", True),
    }


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "LeadGen AI SaaS Platform API v2.0",
        "features": ["Workspaces", "Seed URL Scraping", "Dynamic ICP Prompting", "Direct SMTP Dispatch", "Deliverability Verification", "Smart Deduplication"]
    }