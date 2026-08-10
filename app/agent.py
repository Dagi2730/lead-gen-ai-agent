import os
import asyncio
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from app.schemas import EnrichedLead, LeadGenResponse
from app.tools import search_companies

load_dotenv()

class LeadGenAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4000,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
    async def _process_batch(self, count: int, industry: str, location: str, batch_idx: int) -> list:
        search_results_raw = ""
        try:
            search_query = f"top {count} {industry} companies in {location}"
            search_results_raw = await asyncio.wait_for(
                asyncio.to_thread(search_companies.invoke, {"query": search_query}),
                timeout=6.0
            )
        except Exception as e:
            print(f"Search warning or timeout on batch {batch_idx}: {str(e)}")
            search_results_raw = f"General directory context for {industry} in {location}."

        structured_llm = self.llm.with_structured_output(LeadGenResponse)
        
        prompt = f"""
        You are an elite B2B Lead Generation and Growth Expert AI.
        
        Analyze the search context or industry profile for '{industry}' in '{location}':
        {search_results_raw}
        
        Your instructions:
        1. Generate exactly {count} professional, realistic, and distinct B2B lead entries for '{industry}' located in '{location}'. 
        2. Give each company a realistic name, a professional website domain, a real-looking business email, and a phone number. DO NOT use generic placeholder names like "Enterprise 1".
        3. Provide a concise company description (1-2 sentences), a professional contact email, and a business phone number.
        4. Assign a realistic icp_fit_score from 6 to 10 based on relevance.
        5. Write a brief qualification_reasoning and a tailored, persuasive suggested_outreach_angle.
        """
        
        try:
            result = await asyncio.wait_for(structured_llm.ainvoke(prompt), timeout=12.0)
            if result and result.leads:
                return result.leads
        except Exception as e:
            print(f"LLM Batch Processing Error: {str(e)}")
            
        return []

    async def run_pipeline(self, industry: str, location: str, max_results: int) -> LeadGenResponse:
        # Safe chunking configuration: process in chunks of max 15 leads per LLM request
        batch_size = 15
        target_batches = []
        remaining = max_results
        
        while remaining > 0:
            chunk = min(remaining, batch_size)
            target_batches.append(chunk)
            remaining -= chunk

        all_leads = []
        # Execute batches sequentially or in small groups to prevent rate limits and timeouts
        for idx, count in enumerate(target_batches):
            print(f"Processing batch {idx + 1} of {len(target_batches)} ({count} leads)...")
            batch_leads = await self._process_batch(count, industry, location, idx)
            all_leads.extend(batch_leads)
            # Brief pause between large batch requests to respect API rate limits
            await asyncio.sleep(0.5)

        return LeadGenResponse(
            total_leads_analyzed=len(all_leads),
            leads=all_leads
        )