from langchain_core.tools import tool
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from urllib.parse import urlparse
from typing import List

@tool
def search_companies(query: str, max_results: int = 25) -> str:
    """Search the live web for companies matching a specific query and location using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r.get('title')}\nURL: {r.get('href')}\nSnippet: {r.get('body')}\n")
        if not results:
            return "No live companies found for this query."
        return "\n---|\n".join(results)
    except Exception as e:
        return f"Error executing web search: {str(e)}"

@tool
def scrape_company_website(url: str) -> str:
    """Scrapes raw text content from a live company website URL to analyze their offerings and gaps."""
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        response = requests.get(url, timeout=6, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            for script in soup(["script", "style", "nav", "footer", "noscript"]):
                script.decompose()
            text = soup.get_text(separator=' ', strip=True)
            return text[:2500]
        return f"Could not retrieve content, status code: {response.status_code}"
    except Exception as e:
        return f"Error scraping website: {str(e)}"

def scrape_seed_urls(seed_urls_raw: str) -> str:
    """Scrapes multiple user-provided seed URLs or directory links and compiles structured context."""
    if not seed_urls_raw:
        return ""
    
    urls = [u.strip() for u in seed_urls_raw.replace("\n", ",").split(",") if u.strip()]
    aggregated = []
    
    for url in urls[:5]:  # Limit to 5 seed URLs per batch
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            response = requests.get(url, timeout=7, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                    tag.decompose()
                title = soup.title.string.strip() if soup.title else domain
                body = soup.get_text(separator=' ', strip=True)[:1800]
                aggregated.append(f"=== SEED SOURCE: {domain} ({url}) ===\nTitle: {title}\nContent Snippet: {body}\n")
        except Exception as e:
            aggregated.append(f"=== SEED SOURCE: {url} ===\nScrape Warning: {str(e)}\n")
            
    return "\n".join(aggregated)