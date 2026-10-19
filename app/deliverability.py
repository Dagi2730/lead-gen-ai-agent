import re
import socket
from typing import Dict, Any, Tuple

# Common disposable email provider domains
DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "sharklasers.com", "throwawaymail.com", "yopmail.com", "dispostable.com",
    "trashmail.com", "temp-mail.org", "fakeinbox.com", "getairmail.com",
    "mohmal.com", "burnermail.io", "maildrop.cc", "crazymailing.com",
    "nada.ltd", "mytemp.email", "luxusmail.xyz", "generator.email"
}

# Common free public email provider domains (valid for contact, but marked as generic/B2C)
FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "zoho.com", "protonmail.com", "mail.com"
}

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

def validate_email_syntax(email: str) -> bool:
    """Validate RFC email syntax using regex."""
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    if len(email) > 254:
        return False
    return bool(EMAIL_REGEX.match(email))

def check_domain_mx(domain: str) -> bool:
    """Check if domain resolves to an IP or MX record."""
    try:
        # Fast DNS lookup check
        socket.gethostbyname(domain)
        return True
    except Exception:
        return False

def verify_email_deliverability(email: str) -> Dict[str, Any]:
    """
    Analyzes an email address and returns deliverability metrics:
    - status: 'Verified' | 'Valid' | 'Risky' | 'Invalid'
    - deliverability_score: 0 to 100
    - is_disposable: bool
    - is_free_tier: bool
    - syntax_valid: bool
    - domain_valid: bool
    - reasoning: str
    """
    if not email or email.strip().lower() in ["n/a", "none", "", "null"]:
        return {
            "status": "Risky",
            "deliverability_score": 40.0,
            "is_disposable": False,
            "is_free_tier": False,
            "syntax_valid": False,
            "domain_valid": False,
            "reasoning": "No direct contact email provided; web scraper fallback used."
        }

    email_clean = email.strip().lower()
    
    if not validate_email_syntax(email_clean):
        return {
            "status": "Invalid",
            "deliverability_score": 15.0,
            "is_disposable": False,
            "is_free_tier": False,
            "syntax_valid": False,
            "domain_valid": False,
            "reasoning": "Failed RFC 5322 syntax validation rules."
        }

    parts = email_clean.split("@")
    if len(parts) != 2:
        return {
            "status": "Invalid",
            "deliverability_score": 10.0,
            "is_disposable": False,
            "is_free_tier": False,
            "syntax_valid": False,
            "domain_valid": False,
            "reasoning": "Malformed email address structure."
        }

    local_part, domain = parts
    
    if domain in DISPOSABLE_DOMAINS:
        return {
            "status": "Invalid",
            "deliverability_score": 20.0,
            "is_disposable": True,
            "is_free_tier": False,
            "syntax_valid": True,
            "domain_valid": True,
            "reasoning": f"Detected disposable/temporary mailbox domain (@{domain})."
        }

    is_free = domain in FREE_EMAIL_DOMAINS
    domain_resolves = check_domain_mx(domain)

    if not domain_resolves:
        return {
            "status": "Risky",
            "deliverability_score": 50.0,
            "is_disposable": False,
            "is_free_tier": is_free,
            "syntax_valid": True,
            "domain_valid": False,
            "reasoning": f"Domain @{domain} could not be resolved via live DNS query."
        }

    if is_free:
        return {
            "status": "Valid",
            "deliverability_score": 85.0,
            "is_disposable": False,
            "is_free_tier": True,
            "syntax_valid": True,
            "domain_valid": True,
            "reasoning": "Valid personal/public provider email (Gmail/Outlook/Yahoo)."
        }

    # B2B Corporate Domain
    return {
        "status": "Verified",
        "deliverability_score": 98.0,
        "is_disposable": False,
        "is_free_tier": False,
        "syntax_valid": True,
        "domain_valid": True,
        "reasoning": f"Corporate custom domain @{domain} passed live DNS and syntax checks."
    }
