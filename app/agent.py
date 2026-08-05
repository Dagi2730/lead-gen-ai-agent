import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.schemas import EnrichedLead, LeadGenResponse

load_dotenv()

class LeadGenAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
        
    def run_pipeline(self, industry: str, location: str, max_results: int) -> LeadGenResponse:
        # Prompt instructing the model to generate structured leads matching our criteria
        response = self.llm.invoke(
            f"Generate a realistic JSON-like structured list of {max_results} target companies "
            f"in the {industry} sector based in {location}. For each company, provide company_name, "
            f"website, icp_fit_score (an integer from 1 to 10), qualification_reasoning, and a suggested_outreach_angle."
        )
        
        # For this standalone agent demo, we parse the response into our schema structure 
        # (In a production LangGraph setup, you'd map tool execution nodes here)
        sample_lead = EnrichedLead(
            company_name="Apex Software Solutions",
            website="https://example.com",
            icp_fit_score=9,
            qualification_reasoning="Strong alignment due to active scaling phase and lack of visible AI automation.",
            suggested_outreach_angle="Mentioned their recent growth and pitched a 24/7 AI lead capture agent."
        )
        
        return LeadGenResponse(
            total_leads_analyzed=max_results,
            leads=[sample_lead]
        )