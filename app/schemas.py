from pydantic import BaseModel, Field
from typing import List
from pydantic import BaseModel, EmailStr
from typing import List, Optional

class LeadGenRequest(BaseModel):
    industry: str
    location: str
    max_results: int = 10

class LeadResponse(BaseModel):
    company_name: str
    website: str
    description: Optional[str] = "N/A"
    email: Optional[str] = "N/A"
    phone: Optional[str] = "N/A"
    icp_fit_score: float
    qualification_reasoning: str
    suggested_outreach_angle: str
    confidence: Optional[str] = "Verified"

class LeadGenResponse(BaseModel):
    status: str
    total_leads_analyzed: int
    leads: List[LeadResponse]

class LeadGenRequest(BaseModel):
    industry: str = Field(..., description="Target industry, e.g., 'SaaS startups'")
    location: str = Field(..., description="Target location, e.g., 'Austin, TX'")
    max_results: int = Field(25, description="Maximum number of leads to process")

class EnrichedLead(BaseModel):
    company_name: str = Field(description="Name of the target company")
    website: str = Field(description="Company website URL")
    description: str = Field(description="A brief 1-2 sentence description or overview of what the company does")
    email: str = Field(description="Professional contact email")
    phone: str = Field(description="Company business phone number")
    icp_fit_score: int = Field(description="Score from 1 to 10")
    qualification_reasoning: str = Field(description="Brief explanation of ICP fit")
    suggested_outreach_angle: str = Field(description="Personalized outreach hook")
    company_name: str = Field(description="Name of the target company")
    website: str = Field(description="Company website URL")
    description: str = Field(description="A brief 1-2 sentence description")
    email: str = Field(description="Professional contact email")
    phone: str = Field(description="Company business phone number")
    icp_fit_score: int = Field(description="Score from 1 to 10")
    qualification_reasoning: str = Field(description="Brief explanation of ICP fit")
    suggested_outreach_angle: str = Field(description="Personalized outreach hook")
    confidence: str = Field(default="Verified", description="Either 'Verified' or 'AI-Inferred'")

class LeadGenResponse(BaseModel):
    status: str = Field(default="success")
    total_leads_analyzed: int
    leads: List[EnrichedLead]