from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.schemas import LeadGenRequest, LeadGenResponse
from app.agent import LeadGenAgent
from app.database import SessionLocal, init_db, SearchSession, DBLead

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

@app.post("/api/v1/generate-leads", response_model=LeadGenResponse)
async def generate_leads(payload: LeadGenRequest, db: Session = Depends(get_db)):
    try:
        # Run agent pipeline
        result = agent.run_pipeline(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results
        )
        
        # Save search session to database
        db_session = SearchSession(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        # Save individual leads linked to session
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