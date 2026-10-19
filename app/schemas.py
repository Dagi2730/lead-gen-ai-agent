from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class LeadGenRequest(BaseModel):
    industry: str = Field(..., description="Target industry, e.g. 'B2B FinTech' or 'AI SaaS'")
    location: str = Field(..., description="Target location or region, e.g. 'San Francisco, CA' or 'Global'")
    max_results: int = Field(10, description="Maximum number of leads to find and enrich")
    seed_urls: Optional[str] = Field(None, description="Comma-separated seed URLs or niche directory links to scrape directly")
    custom_icp_rules: Optional[str] = Field(None, description="Custom qualification rules, tech constraints, or prompts")
    deduplicate_against_history: bool = Field(True, description="Filter out companies previously recorded in the database")

class EnrichedLead(BaseModel):
    id: Optional[int] = None
    company_name: str = Field(description="Name of the target company")
    website: str = Field(description="Company website URL")
    description: str = Field(default="", description="Brief 1-2 sentence overview of business offerings")
    email: str = Field(default="", description="Professional contact email")
    phone: str = Field(default="", description="Company business phone number")
    location: Optional[str] = Field(default="", description="Location or headquarters")
    icp_fit_score: float = Field(default=8.0, description="ICP Score from 1 to 10")
    qualification_reasoning: str = Field(default="", description="Explanation of ICP fit and qualification")
    suggested_outreach_angle: str = Field(default="", description="Tailored cold outreach hook")
    confidence: str = Field(default="Verified", description="'Verified', 'AI-Inferred', or 'Imported'")
    deliverability_status: Optional[str] = Field(default="Verified", description="'Verified', 'Valid', 'Risky', 'Invalid'")
    deliverability_score: Optional[float] = Field(default=90.0, description="Deliverability confidence score (0-100)")
    assigned_to_user_id: Optional[int] = None
    campaign_status: Optional[str] = Field(default="uncontacted", description="'uncontacted', 'contacted', 'replied', 'converted'")

class LeadGenResponse(BaseModel):
    status: str = Field(default="success")
    total_leads_analyzed: int
    dedup_filtered_count: int = 0
    leads: List[EnrichedLead]

# Workspace Schemas
class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    role: str
    member_count: int = 1
    lead_count: int = 0
    created_at: datetime

class WorkspaceMemberAdd(BaseModel):
    email: EmailStr
    role: str = "member"

class WorkspaceMemberResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str]
    email: str
    role: str
    joined_at: datetime

# Email & SMTP Schemas
class SMTPSettingsSchema(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    password: str = ""
    use_tls: bool = True
    use_ssl: bool = False
    from_name: str = "LeadGen AI Growth Team"
    from_email: str = ""
    is_active: bool = True

class EmailTestRequest(BaseModel):
    host: str
    port: int
    username: str
    password: str
    use_tls: bool = True
    use_ssl: bool = False

class EmailSendRequest(BaseModel):
    lead_id: Optional[int] = None
    recipient_email: EmailStr
    recipient_name: Optional[str] = "Founder / Executive"
    subject: str
    body: str
    step_number: int = 1
    tone: str = "Professional & Consultative"

class DeliverabilityVerifyRequest(BaseModel):
    email: str

class LeadUpdateStatusRequest(BaseModel):
    campaign_status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None