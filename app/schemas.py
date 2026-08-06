from pydantic import BaseModel, Field
from typing import List

class LeadGenRequest(BaseModel):
    industry: str = Field(..., description="Target industry, e.g., 'SaaS startups'")
    location: str = Field(..., description="Target location, e.g., 'Austin, TX'")
    max_results: int = Field(25, description="Maximum number of leads to process")

class EnrichedLead(BaseModel):
    company_name: str = Field(description="Name of the target company")
    website: str = Field(description="Company website URL")
    email: str = Field(description="Professional contact email, e.g., contact@company.com")
    phone: str = Field(description="Company business phone number")
    icp_fit_score: int = Field(description="Score from 1 to 10 indicating fit against Ideal Customer Profile")
    qualification_reasoning: str = Field(description="Brief explanation of why this company matches the ICP")
    suggested_outreach_angle: str = Field(description="Personalized cold outreach hook based on their profile")

class LeadGenResponse(BaseModel):
    status: str = Field(default="success")
    total_leads_analyzed: int
    leads: List[EnrichedLead]