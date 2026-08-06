from langchain_core.tools import tool
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

@tool
def search_companies(query: str, max_results: int = 25) -> str:
    """Search the live web for companies matching a specific query and location using DuckDuckGo."""
    try:
        results = []
        with DDGS() as ddgs:
            # Dynamically use the passed max_results parameter instead of hardcoding 5
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
        response = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            for script in soup(["script", "style", "nav", "footer"]):
                script.decompose()
            text = soup.get_text(separator=' ', strip=True)
            return text[:2000]
        return f"Could not retrieve content, status code: {response.status_code}"
    except Exception as e:
        return f"Error scraping website: {str(e)}"