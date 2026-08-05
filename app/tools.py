from langchain_core.tools import tool
import requests
from bs4 import BeautifulSoup

@tool
def search_companies(query: str) -> str:
    """Search the web for companies matching a specific query and location."""
    return f"Found mock company search results for query: {query}. Companies include Apex Software Solutions, ByteCraft Tech, and Modern Cloud Group."

@tool
def scrape_company_website(url: str) -> str:
    """Scrapes raw text content from a company website to analyze their tech stack or offerings."""
    try:
        response = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text(separator=' ', strip=True)
            return text[:2000]
        return "Could not retrieve website content."
    except Exception as e:
        return f"Error scraping website: {str(e)}"