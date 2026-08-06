from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import LeadGenRequest, LeadGenResponse
from app.agent import LeadGenAgent

# Initialize FastAPI app first
app = FastAPI(
    title="Autonomous Lead Generation & Enrichment Agent API",
    description="A backend API running an AI agent for B2B prospecting and qualification.",
    version="1.0.0"
)

# Enable CORS right after app creation so your React frontend can talk to this backend smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = LeadGenAgent()

@app.post("/api/v1/generate-leads", response_model=LeadGenResponse)
async def generate_leads(payload: LeadGenRequest):
    try:
        result = agent.run_pipeline(
            industry=payload.industry,
            location=payload.location,
            max_results=payload.max_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Lead Gen Agent API is running"}