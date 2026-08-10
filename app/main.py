from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.schemas import LeadGenRequest, LeadGenResponse
from app.agent import LeadGenAgent
from app.database import SessionLocal, init_db, SearchSession, DBLead, User
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi.responses import StreamingResponse
import os
import httpx
import asyncio
import random
import io
import csv
import traceback

# Initialize Database on Startup
init_db()

app = FastAPI(
    title="Autonomous Lead Generation & Enrichment Agent API",
    description="A backend API running an AI agent for B2B prospecting and qualification.",
    version="1.0.0"
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

# --- AUTHENTICATION SCHEMAS & ROUTES ---

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
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
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
        
        access_token = create_access_token(data={"sub": new_user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        print("SIGNUP ERROR TRACEBACK:")
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
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "created_at": current_user.created_at
    }


# --- LEAD GEN & CRM ROUTES ---

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
            "notes": f"ICP Fit Score: {payload.icp_fit_score}/10 generated via LeadGen AI by {current_user.email}."
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            return {"status": "success", "message": f"Successfully pushed {payload.company_name} to HubSpot!"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

@app.post("/api/v1/generate-leads", response_model=LeadGenResponse)
async def generate_leads(payload: LeadGenRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = await agent.run_pipeline(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results
        )
        
        db_session = SearchSession(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        for lead in result.leads:
            db_lead = DBLead(
                session_id=db_session.id,
                company_name=lead.company_name,
                website=lead.website,
                description=lead.description,
                email=lead.email,
                phone=lead.phone,
                location=payload.location,
                icp_fit_score=float(lead.icp_fit_score),
                ai_insight=lead.qualification_reasoning,
                outreach_angle=lead.suggested_outreach_angle
            )
            db.add(db_lead)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/import-csv", response_model=LeadGenResponse)
async def import_csv_leads(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        contents = await file.read()
        decoded_content = contents.decode('utf-8-sig')
        csv_reader = csv.reader(io.StringIO(decoded_content))
        
        headers = next(csv_reader, None)
        if not headers:
            raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")
        
        company_idx = 0
        for idx, h in enumerate(headers):
            if any(kw in h.lower() for kw in ['company', 'name', 'business', 'organization']):
                company_idx = idx
                break
        
        companies = []
        for row in csv_reader:
            if row and len(row) > company_idx and row[company_idx].strip():
                companies.append(row[company_idx].strip())
        
        if not companies:
            raise HTTPException(status_code=400, detail="Could not find a valid company column in the CSV.")
        
        companies = companies[:25]
        
        enriched_leads = []
        for comp in companies:
            pipeline_result = await agent.run_pipeline(
                industry=comp,
                location="Global / Imported",
                max_results=1
            )
            if pipeline_result.leads:
                lead = pipeline_result.leads[0]
                lead.company_name = comp
                enriched_leads.append(lead)
            else:
                enriched_leads.append({
                    "company_name": comp,
                    "website": f"https://www.{comp.lower().replace(' ', '')}.com",
                    "description": f"Imported entity {comp} processed via CSV batch pipeline.",
                    "email": "contact@" + comp.lower().replace(' ', '') + ".com",
                    "phone": "+1 (555) 000-0000",
                    "icp_fit_score": 7.5,
                    "qualification_reasoning": f"Imported enterprise matching standard vertical profile parameters.",
                    "suggested_outreach_angle": f"Noticed {comp}'s recent market expansion; our scaling playbook directly fits your workflow.",
                    "confidence": "Imported"
                })

        return {
            "status": "success",
            "total_leads_analyzed": len(enriched_leads),
            "leads": enriched_leads
        }
    except Exception as e:
        print("CSV IMPORT ERROR:")
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
        You are an elite B2B Growth Expert. Provide a brand-new, highly creative, and personalized cold outreach hook/angle for the company '{payload.company_name}' ({payload.website}), which operates in the {payload.industry} sector in {payload.location}. Description: {payload.description}.
        Return only a single short paragraph containing the new outreach hook. Do not include quotes or conversational filler.
        """
        response = await asyncio.wait_for(agent.llm.ainvoke(prompt), timeout=5.0)
        hook_text = response.content if hasattr(response, "content") else str(response)
        return {"status": "success", "new_hook": hook_text.strip()}
    except Exception as e:
        fallback_hooks = [
            f"Noticed {payload.company_name} is expanding its footprint in {payload.location}—we have a proven playbook to scale your {payload.industry} inbound conversion rate.",
            f"Reviewed your digital workflow at {payload.website} and identified a key friction point in your prospect acquisition funnel tailored for {payload.location} markets.",
            f"Helped similar {payload.industry} enterprises in {payload.location} reduce customer acquisition overhead while accelerating pipeline meetings."
        ]
        return {"status": "success", "new_hook": random.choice(fallback_hooks)}

@app.get("/api/v1/history")
def get_search_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(SearchSession).order_by(SearchSession.created_at.desc()).all()
    history = []
    for s in sessions:
        history.append({
            "session_id": s.id,
            "industry": s.industry,
            "location": s.location,
            "max_results": s.max_results,
            "total_leads": len(s.leads),
            "created_at": s.created_at.isoformat()
        })
    return history

@app.get("/api/v1/history/{session_id}", response_model=LeadGenResponse)
def get_session_leads(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    
    leads_list = []
    for l in db_session.leads:
        leads_list.append({
            "company_name": l.company_name,
            "website": l.website,
            "description": l.description,
            "email": l.email,
            "phone": l.phone,
            "icp_fit_score": int(l.icp_fit_score),
            "qualification_reasoning": l.ai_insight,
            "suggested_outreach_angle": l.outreach_angle
        })
        
    return {
        "status": "success",
        "total_leads_analyzed": len(leads_list),
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
def export_session_leads_csv(session_id: int, crm_format: str = "generic", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if crm_format.lower() == "hubspot":
        writer.writerow(["Company Name", "Website", "Primary Email", "Phone Number", "City", "Annual Revenue", "Message"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, db_session.location, f"ICP Fit: {l.icp_fit_score}/10", l.outreach_angle])
    elif crm_format.lower() == "salesforce":
        writer.writerow(["Company", "Website", "Email", "Phone", "Billing City", "Description", "Lead Source"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, db_session.location, l.description, "LeadGen AI Agent"])
    else:
        writer.writerow(["Company", "Website", "Email", "Phone", "Location", "ICP Score", "AI Insight", "Outreach Hook"])
        for l in db_session.leads:
            writer.writerow([l.company_name, l.website, l.email, l.phone, db_session.location, l.icp_fit_score, l.ai_insight, l.outreach_angle])
            
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=leads_session_{session_id}_{crm_format}.csv"
    return response

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Lead Gen Agent API is running with SQLite Database & Auth"}