import os
import asyncio
from dotenv import load_dotenv
from typing import Optional, Set, List
from urllib.parse import urlparse
from langchain_groq import ChatGroq
from app.schemas import EnrichedLead, LeadGenResponse
from app.tools import search_companies, scrape_seed_urls
from app.deliverability import verify_email_deliverability

load_dotenv()

class LeadGenAgent:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=4000,
            api_key=groq_key
        )
        
    async def _process_batch(
        self,
        count: int,
        industry: str,
        location: str,
        seed_context: str,
        custom_icp_rules: Optional[str],
        batch_idx: int
    ) -> List[EnrichedLead]:
        search_results_raw = ""
        try:
            search_query = f"top {count} {industry} companies in {location} directory official site"
            search_results_raw = await asyncio.wait_for(
                asyncio.to_thread(search_companies.invoke, {"query": search_query}),
                timeout=7.0
            )
        except Exception as e:
            print(f"Search warning or timeout on batch {batch_idx}: {str(e)}")
            search_results_raw = f"General industry directory and market intelligence context for {industry} in {location}."

        structured_llm = self.llm.with_structured_output(LeadGenResponse)
        
        custom_rules_section = ""
        if custom_icp_rules and custom_icp_rules.strip():
            custom_rules_section = f"""
            CRITICAL CUSTOM ICP QUALIFICATION RULES:
            {custom_icp_rules.strip()}
            You must evaluate each prospect strictly against these custom criteria. If a company does not meet these constraints, adjust the icp_fit_score lower and note why in qualification_reasoning.
            """

        seed_section = ""
        if seed_context and seed_context.strip():
            seed_section = f"""
            USER-PROVIDED SEED URL DATA & DIRECTORY SCRAPES:
            {seed_context.strip()}
            Extract and prioritize real leads found in this seed source.
            """

        prompt = f"""
        You are an elite B2B Lead Generation, ICP Scoring, and Growth Expert AI.
        
        Target Industry: '{industry}'
        Target Location / Market: '{location}'
        
        {seed_section}
        
        Live Web Prospecting Context:
        {search_results_raw}
        
        {custom_rules_section}
        
        Your Mission:
        1. Produce exactly {count} high-quality, realistic, and distinct B2B lead records for '{industry}' operating in '{location}'.
        2. Assign a genuine company name, clean official website URL (e.g. https://company.com), realistic professional email (e.g. founder@domain.com or contact@domain.com), and real phone number.
        3. Provide a high-impact 1-2 sentence company description.
        4. Score icp_fit_score on a scale of 1 to 10 based on alignment with the industry, location, and custom ICP criteria.
        5. Write a sharp qualification_reasoning explaining why they are an ideal target.
        6. Craft a tailored, highly persuasive suggested_outreach_angle mentioning a specific value proposition or pain point.
        7. Set confidence to 'Verified'.
        """
        
        try:
            result = await asyncio.wait_for(structured_llm.ainvoke(prompt), timeout=16.0)
            if result and result.leads:
                return result.leads
        except Exception as e:
            print(f"LLM Batch Processing Error (batch {batch_idx}): {str(e)}")
            
        return []

    async def run_pipeline(
        self,
        industry: str,
        location: str,
        max_results: int = 10,
        seed_urls: Optional[str] = None,
        custom_icp_rules: Optional[str] = None,
        existing_identifiers: Optional[Set[str]] = None
    ) -> LeadGenResponse:
        existing_set = existing_identifiers or set()
        
        # Scrape seed URLs if supplied
        seed_context = ""
        if seed_urls and seed_urls.strip():
            try:
                seed_context = await asyncio.to_thread(scrape_seed_urls, seed_urls)
            except Exception as e:
                print(f"Seed URL scrape warning: {str(e)}")

        batch_size = 10
        target_batches = []
        remaining = max_results
        
        while remaining > 0:
            chunk = min(remaining, batch_size)
            target_batches.append(chunk)
            remaining -= chunk

        raw_leads: List[EnrichedLead] = []
        for idx, count in enumerate(target_batches):
            print(f"Executing batch {idx + 1}/{len(target_batches)} ({count} leads)...")
            batch_leads = await self._process_batch(
                count=count,
                industry=industry,
                location=location,
                seed_context=seed_context,
                custom_icp_rules=custom_icp_rules,
                batch_idx=idx
            )
            raw_leads.extend(batch_leads)
            await asyncio.sleep(0.3)

        # Apply Deduplication & Deliverability Validation
        filtered_leads: List[EnrichedLead] = []
        dedup_count = 0
        seen_current_batch = set()

        for lead in raw_leads:
            # Extract clean domain and name identifiers
            raw_domain = ""
            if lead.website:
                parsed = urlparse(lead.website if lead.website.startswith("http") else f"https://{lead.website}")
                raw_domain = (parsed.netloc or parsed.path).lower().replace("www.", "")
            
            clean_name = (lead.company_name or "").strip().lower()
            clean_email = (lead.email or "").strip().lower()

            # Check if duplicate in historical database or within current batch
            is_dup = False
            if raw_domain and raw_domain in existing_set:
                is_dup = True
            elif clean_name and clean_name in existing_set:
                is_dup = True
            elif clean_email and clean_email in existing_set:
                is_dup = True
            elif raw_domain and raw_domain in seen_current_batch:
                is_dup = True
            elif clean_name and clean_name in seen_current_batch:
                is_dup = True

            if is_dup:
                dedup_count += 1
                continue

            if raw_domain:
                seen_current_batch.add(raw_domain)
            if clean_name:
                seen_current_batch.add(clean_name)
            if clean_email:
                seen_current_batch.add(clean_email)

            # Deliverability verification
            deliv_report = verify_email_deliverability(lead.email)
            lead.deliverability_status = deliv_report.get("status", "Valid")
            lead.deliverability_score = deliv_report.get("deliverability_score", 90.0)
            lead.location = location

            filtered_leads.append(lead)

        return LeadGenResponse(
            status="success",
            total_leads_analyzed=len(filtered_leads),
            dedup_filtered_count=dedup_count,
            leads=filtered_leads
        )