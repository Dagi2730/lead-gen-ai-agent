from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas import LeadGenRequest, LeadGenResponse
from app.agent import LeadGenAgent
from app.database import SessionLocal, init_db, SearchSession, DBLead
import os
import httpx
import asyncio
import random

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

class HubSpotPushRequest(BaseModel):
    company_name: str
    website: str
    email: str
    phone: str
    location: str
    icp_fit_score: float

@app.post("/api/v1/push-to-hubspot")
async def push_to_hubspot(payload: HubSpotPushRequest):
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
            "notes": f"ICP Fit Score: {payload.icp_fit_score}/10 generated via LeadGen AI."
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            return {"status": "success", "message": f"Successfully pushed {payload.company_name} to HubSpot!"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.text)

@app.post("/api/v1/generate-leads", response_model=LeadGenResponse)
async def generate_leads(payload: LeadGenRequest, db: Session = Depends(get_db)):
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

class RegenerateHookRequest(BaseModel):
    company_name: str
    website: str
    description: str
    industry: str
    location: str

@app.post("/api/v1/regenerate-hook")
async def regenerate_hook(payload: RegenerateHookRequest):
    try:
        prompt = f"""
        You are an elite B2B Growth Expert. Provide a brand-new, highly creative, and personalized cold outreach hook/angle for the company '{payload.company_name}' ({payload.website}), which operates in the {payload.industry} sector in {payload.location}. Description: {payload.description}.
        Return only a single short paragraph containing the new outreach hook. Do not include quotes or conversational filler.
        """
        # Wrap LLM call in a strict 5-second timeout safeguard so it never hangs
        response = await asyncio.wait_for(agent.llm.ainvoke(prompt), timeout=5.0)
        hook_text = response.content if hasattr(response, "content") else str(response)
        return {"status": "success", "new_hook": hook_text.strip()}
    except Exception as e:
        # Instant fallback hook generator so it always returns instantly without hanging
        fallback_hooks = [
            f"Noticed {payload.company_name} is expanding its footprint in {payload.location}—we have a proven playbook to scale your {payload.industry} inbound conversion rate.",
            f"Reviewed your digital workflow at {payload.website} and identified a key friction point in your prospect acquisition funnel tailored for {payload.location} markets.",
            f"Helped similar {payload.industry} enterprises in {payload.location} reduce customer acquisition overhead while accelerating pipeline meetings."
        ]
        return {"status": "success", "new_hook": random.choice(fallback_hooks)}

@app.get("/api/v1/history")
def get_search_history(db: Session = Depends(get_db)):
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
def get_session_leads(session_id: int, db: Session = Depends(get_db)):
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
def delete_search_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(SearchSession).filter(SearchSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Search session not found")
    db.delete(db_session)
    db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted successfully"}

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Lead Gen Agent API is running with SQLite Database"}