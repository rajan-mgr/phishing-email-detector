# import os
# import sys
# import re
# import joblib
# import pandas as pd

# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# from features import build_features, load_vectorizer

# # ── Paths ──────────────────────────────────────────────────────────────────────
# BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
# MODEL_LR   = os.path.join(BASE_DIR, '..', 'data', 'model_lr.pkl')
# MODEL_RF   = os.path.join(BASE_DIR, '..', 'data', 'model_rf.pkl')

# # ── Whitelist of known legitimate domains ─────────────────────────────────────
# # Subdomain matching is automatic — adding 'anthropic.com' covers
# # 'mail.anthropic.com', 'no-reply@mail.anthropic.com', etc.
# LEGITIMATE_DOMAINS = {
#     # Dev & code hosting
#     'github.com', 'gitlab.com', 'bitbucket.org',
#     'stackoverflow.com', 'stackexchange.com',
#     'vercel.com', 'netlify.com', 'heroku.com',
#     'railway.app', 'render.com',

#     # Google
#     'google.com', 'gmail.com', 'googlemail.com',
#     'googleapis.com', 'googleusercontent.com',
#     'accounts.google.com',

#     # Microsoft
#     'microsoft.com', 'outlook.com', 'hotmail.com',
#     'live.com', 'office.com', 'azure.com',
#     'teams.microsoft.com',

#     # Apple
#     'apple.com', 'icloud.com',

#     # Amazon / AWS
#     'amazon.com', 'amazonaws.com', 'aws.amazon.com',

#     # Social
#     'facebook.com', 'facebookmail.com', 'meta.com',
#     'instagram.com', 'whatsapp.com',
#     'twitter.com', 'x.com',
#     'linkedin.com',
#     'reddit.com',
#     'pinterest.com', 'tumblr.com',
#     'snapchat.com',
#     'tiktok.com',

#     # Messaging / Productivity
#     'slack.com', 'discord.com',
#     'zoom.us', 'webex.com',
#     'notion.so', 'figma.com', 'canva.com',
#     'miro.com', 'trello.com', 'asana.com',
#     'airtable.com', 'monday.com',

#     # Storage
#     'dropbox.com', 'box.com',
#     'drive.google.com',

#     # Payment
#     'paypal.com', 'stripe.com', 'square.com',
#     'razorpay.com', 'esewa.com.np', 'khalti.com',

#     # AI / ML
#     'openai.com', 'anthropic.com', 'huggingface.co',
#     'kaggle.com', 'colab.research.google.com',

#     # Streaming / Entertainment
#     'youtube.com', 'netflix.com', 'spotify.com',
#     'twitch.tv', 'patreon.com', 'creator.patreon.com',
#     'info.patreon.com',

#     # Gaming
#     'steampowered.com', 'epicgames.com',
#     'chess.com', 'moonton.com',

#     # E-commerce
#     'daraz.com.np', 'sastodeal.com',
#     'ebay.com', 'etsy.com', 'shopify.com',

#     # CDN / Infrastructure
#     'cloudflare.com', 'fastly.com',
#     'jsdelivr.net', 'cdnjs.cloudflare.com',
#     'fontawesome.com',
#     'sendgrid.net', 'mailchimp.com', 'mailgun.org',
#     'amazonses.com',  # Amazon SES — used by many legit services

#     # Telecom / Utility
#     'truecaller.com', 'telegram.org',

#     # Education
#     'coursera.org', 'udemy.com', 'edx.org',
#     'khanacademy.org',

#     # Reference
#     'wikipedia.org', 'wikimedia.org',

#     # Browsers
#     'mozilla.org', 'brave.com', 'opera.com',

#     # Hardware
#     'dell.com', 'hp.com', 'lenovo.com',
#     'samsung.com', 'sony.com', 'intel.com',
#     'nvidia.com', 'cisco.com',

#     # Enterprise
#     'adobe.com', 'salesforce.com',
#     'ibm.com', 'oracle.com', 'sap.com',
#     'hubspot.com', 'zendesk.com',

#     # Publishing
#     'medium.com', 'substack.com',
# }

# # ── Active model state ────────────────────────────────────────────────────────
# _active_model_name = "rf"
# _model_lr = None
# _model_rf = None
# _vectorizer = None


# def _load_models():
#     global _model_lr, _model_rf, _vectorizer
#     try:
#         _model_lr = joblib.load(MODEL_LR)
#         _model_rf = joblib.load(MODEL_RF)
#         _vectorizer = load_vectorizer()
#         print("✅ Models and vectorizer loaded")
#     except FileNotFoundError as e:
#         print(f"⚠️  Warning: {e}")


# def get_active_model():
#     return _active_model_name


# def set_active_model(name):
#     global _active_model_name
#     if name not in ("lr", "rf"):
#         raise ValueError("Model must be 'lr' or 'rf'")
#     _active_model_name = name


# def get_model_object():
#     return _model_lr if _active_model_name == "lr" else _model_rf


# def get_model_info():
#     return {
#         "active": _active_model_name,
#         "models": {
#             "lr": {"name": "Logistic Regression", "loaded": _model_lr is not None},
#             "rf": {"name": "Random Forest",        "loaded": _model_rf is not None},
#         }
#     }


# # Load on import
# _load_models()


# def _extract_sender_domain(sender: str) -> str:
#     """
#     Reliably extract the domain from a sender string like:
#       'Anthropic <no-reply@mail.anthropic.com>'
#       'no-reply@mail.anthropic.com'
#       'notifications@vercel.com'
#     Returns lowercase domain string or empty string.
#     """
#     # Pull email address from angle brackets if present
#     match = re.search(r'<([^>]+)>', sender)
#     email = match.group(1) if match else sender.strip()

#     # Extract domain after @
#     if '@' in email:
#         domain = email.split('@')[-1].strip().lower()
#         # Strip any trailing > or whitespace
#         domain = re.sub(r'[>\s]', '', domain)
#         return domain
#     return ""


# def _is_whitelisted(domain: str) -> bool:
#     """
#     Check if a domain or any of its parent domains is in the whitelist.
#     e.g. 'mail.anthropic.com' → checks 'mail.anthropic.com', 'anthropic.com'
#     """
#     if not domain:
#         return False
#     parts = domain.split('.')
#     for i in range(len(parts) - 1):
#         candidate = '.'.join(parts[i:])
#         if candidate in LEGITIMATE_DOMAINS:
#             return True
#     return False


# def predict_email(subject: str, body: str, sender: str = "") -> dict:
#     model = get_model_object()
#     if model is None or _vectorizer is None:
#         raise RuntimeError("Models not loaded. Run train.py first.")

#     text = f"{subject} {body}".strip()

#     # Extract and check sender domain properly
#     sender_domain = _extract_sender_domain(sender)
#     sender_whitelisted = _is_whitelisted(sender_domain)

#     text_series = pd.Series([text])
#     features = build_features(text_series, _vectorizer)

#     label = int(model.predict(features)[0])
#     proba = model.predict_proba(features)[0]
#     confidence = float(proba[label])

#     # If sender is a known-good domain, only flag if model is extremely certain.
#     # Threshold 0.97 means: even if model says phishing, trust the whitelist
#     # unless it's nearly certain (covers cases like actual phishing spoofing legit domains)
#     if sender_whitelisted and label == 1 and confidence < 0.97:
#         label = 0
#         confidence = float(proba[0])

#     if label == 1:
#         risk = "high" if confidence >= 0.85 else "medium" if confidence >= 0.65 else "low"
#     else:
#         risk = "none"

#     flags = _get_flags(text, sender_domain, sender_whitelisted)

#     return {
#         "label": label,
#         "verdict": "phishing" if label == 1 else "legitimate",
#         "confidence": round(confidence, 4),
#         "risk_level": risk,
#         "flags": flags,
#         "model_used": _active_model_name,
#         "sender_domain": sender_domain,
#         "sender_whitelisted": sender_whitelisted,
#     }


# def _get_flags(text: str, sender_domain: str = "", whitelisted: bool = False) -> list:
#     text_lower = text.lower()
#     flags = []

#     if whitelisted:
#         flags.append(f"Sender domain verified: {sender_domain}")

#     if text.count('http') > 2:
#         flags.append(f"Contains {text.count('http')} URLs")

#     if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', text):
#         flags.append("Contains IP address (suspicious link)")

#     urgent_found = [w for w in [
#         'verify', 'urgent', 'suspended', 'confirm', 'password',
#         'click', 'expire', 'validate', 'alert', 'winner', 'prize'
#     ] if w in text_lower]
#     if urgent_found:
#         flags.append(f"Urgent keywords: {', '.join(urgent_found)}")

#     upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
#     if upper_ratio > 0.3:
#         flags.append(f"High uppercase ratio ({upper_ratio:.0%})")

#     if text.count('!') > 3:
#         flags.append(f"Excessive exclamation marks ({text.count('!')})")

#     if text.count('$') > 1:
#         flags.append(f"Multiple dollar signs ({text.count('$')})")

#     if 'click here' in text_lower:
#         flags.append("Contains 'click here'")

#     return flags


import os
import sys
import re
import joblib
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from features import build_features, load_vectorizer

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_LR   = os.path.join(BASE_DIR, '..', 'data', 'model_lr.pkl')
MODEL_RF   = os.path.join(BASE_DIR, '..', 'data', 'model_rf.pkl')

# ── Whitelist of known legitimate domains ─────────────────────────────────────
# NOTE: This is now a FALLBACK layer only, used when SPF/DKIM/DMARC headers
# are missing (some providers strip them, or .eml uploads may lack them).
# It is deliberately NOT the primary defense — see check_authentication()
# and check_brand_impersonation() below for the header-based, non-hardcoded
# signals that do the real work.
#
# Subdomain matching is automatic — adding 'anthropic.com' covers
# 'mail.anthropic.com', 'no-reply@mail.anthropic.com', etc.
LEGITIMATE_DOMAINS = {
    # Dev & code hosting
    'github.com', 'gitlab.com', 'bitbucket.org',
    'stackoverflow.com', 'stackexchange.com',
    'vercel.com', 'netlify.com', 'heroku.com',
    'railway.app', 'render.com',

    # Google
    'google.com', 'gmail.com', 'googlemail.com',
    'googleapis.com', 'googleusercontent.com',
    'accounts.google.com',

    # Microsoft
    'microsoft.com', 'outlook.com', 'hotmail.com',
    'live.com', 'office.com', 'azure.com',
    'teams.microsoft.com',

    # Apple
    'apple.com', 'icloud.com',

    # Amazon / AWS
    'amazon.com', 'amazonaws.com', 'aws.amazon.com',

    # Social
    'facebook.com', 'facebookmail.com', 'meta.com',
    'instagram.com', 'whatsapp.com',
    'twitter.com', 'x.com',
    'linkedin.com',
    'reddit.com',
    'pinterest.com', 'tumblr.com',
    'snapchat.com',
    'tiktok.com',

    # Messaging / Productivity
    'slack.com', 'discord.com',
    'zoom.us', 'webex.com',
    'notion.so', 'figma.com', 'canva.com',
    'miro.com', 'trello.com', 'asana.com',
    'airtable.com', 'monday.com',

    # Storage
    'dropbox.com', 'box.com',
    'drive.google.com',

    # Payment
    'paypal.com', 'stripe.com', 'square.com',
    'razorpay.com', 'esewa.com.np', 'khalti.com',

    # AI / ML
    'openai.com', 'anthropic.com', 'huggingface.co',
    'kaggle.com', 'colab.research.google.com',

    # Streaming / Entertainment
    'youtube.com', 'netflix.com', 'spotify.com',
    'twitch.tv', 'patreon.com', 'creator.patreon.com',
    'info.patreon.com',

    # Gaming
    'steampowered.com', 'epicgames.com',
    'chess.com', 'moonton.com',

    # E-commerce
    'daraz.com.np', 'sastodeal.com',
    'ebay.com', 'etsy.com', 'shopify.com',

    # CDN / Infrastructure
    'cloudflare.com', 'fastly.com',
    'jsdelivr.net', 'cdnjs.cloudflare.com',
    'fontawesome.com',
    'sendgrid.net', 'mailchimp.com', 'mailgun.org',
    'amazonses.com',  # Amazon SES — used by many legit services

    # Telecom / Utility
    'truecaller.com', 'telegram.org',

    # Education
    'coursera.org', 'udemy.com', 'edx.org',
    'khanacademy.org',

    # Cybersecurity training / CTF platforms
    'tryhackme.com', 'hackthebox.com', 'letsdefend.io',
    'pentesterlab.com', 'sans.org', 'cybrary.it',
    'portswigger.net', 'root-me.org', 'overthewire.org',

    # Reference
    'wikipedia.org', 'wikimedia.org',

    # Browsers
    'mozilla.org', 'brave.com', 'opera.com',

    # Hardware
    'dell.com', 'hp.com', 'lenovo.com',
    'samsung.com', 'sony.com', 'intel.com',
    'nvidia.com', 'cisco.com',

    # Enterprise
    'adobe.com', 'salesforce.com',
    'ibm.com', 'oracle.com', 'sap.com',
    'hubspot.com', 'zendesk.com',

    # Publishing
    'medium.com', 'substack.com',
}

# ── Brand list for impersonation detection ────────────────────────────────────
# Maps a brand keyword (as it commonly appears in a display name) to that
# brand's real domain. Unlike LEGITIMATE_DOMAINS, this is used to catch
# spoofing — i.e. the OPPOSITE case — so it doesn't need to be exhaustive
# to be useful; it targets the brands SMEs in Kathmandu are most likely to
# see impersonated (banks, payment platforms, big tech).
KNOWN_BRANDS = {
    'paypal': 'paypal.com',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'apple': 'apple.com',
    'amazon': 'amazon.com',
    'netflix': 'netflix.com',
    'esewa': 'esewa.com.np',
    'khalti': 'khalti.com',
    'nepal rastra bank': 'nrb.org.np',
    'nabil bank': 'nabilbank.com',
    'nic asia': 'nicasiabank.com',
    'facebook': 'facebook.com',
    'instagram': 'instagram.com',
    'whatsapp': 'whatsapp.com',
    'linkedin': 'linkedin.com',
}

# ── Active model state ────────────────────────────────────────────────────────
_active_model_name = "rf"
_model_lr = None
_model_rf = None
_vectorizer = None


def _load_models():
    global _model_lr, _model_rf, _vectorizer
    try:
        _model_lr = joblib.load(MODEL_LR)
        _model_rf = joblib.load(MODEL_RF)
        _vectorizer = load_vectorizer()
        print("✅ Models and vectorizer loaded")
    except FileNotFoundError as e:
        print(f"⚠️  Warning: {e}")


def get_active_model():
    return _active_model_name


def set_active_model(name):
    global _active_model_name
    if name not in ("lr", "rf"):
        raise ValueError("Model must be 'lr' or 'rf'")
    _active_model_name = name


def get_model_object():
    return _model_lr if _active_model_name == "lr" else _model_rf


def get_model_info():
    return {
        "active": _active_model_name,
        "models": {
            "lr": {"name": "Logistic Regression", "loaded": _model_lr is not None},
            "rf": {"name": "Random Forest",        "loaded": _model_rf is not None},
        }
    }


# Load on import
_load_models()


def _extract_sender_domain(sender: str) -> str:
    """
    Reliably extract the domain from a sender string like:
      'Anthropic <no-reply@mail.anthropic.com>'
      'no-reply@mail.anthropic.com'
      'notifications@vercel.com'
    Returns lowercase domain string or empty string.
    """
    match = re.search(r'<([^>]+)>', sender)
    email = match.group(1) if match else sender.strip()

    if '@' in email:
        domain = email.split('@')[-1].strip().lower()
        domain = re.sub(r'[>\s]', '', domain)
        return domain
    return ""


def _extract_display_name(sender: str) -> str:
    """
    Extract the display name portion of a sender string, e.g.
      'PayPal Security <no-reply@paypal-verify-secure.net>' -> 'paypal security'
    Returns lowercase string, empty if no display name present.
    """
    match = re.match(r'^\s*([^<]+)<', sender)
    return match.group(1).strip().lower() if match else ""


def _is_whitelisted(domain: str) -> bool:
    """
    Check if a domain or any of its parent domains is in the whitelist.
    e.g. 'mail.anthropic.com' → checks 'mail.anthropic.com', 'anthropic.com'
    Fallback signal only — see check_authentication() for the primary check.
    """
    if not domain:
        return False
    parts = domain.split('.')
    for i in range(len(parts) - 1):
        candidate = '.'.join(parts[i:])
        if candidate in LEGITIMATE_DOMAINS:
            return True
    return False


def check_authentication(auth_results_header: str) -> dict:
    """
    Parse an email's Authentication-Results header (provided by Gmail/Outlook,
    who already run SPF/DKIM/DMARC checks server-side) for pass/fail verdicts.

    This is the primary, non-hardcoded signal: a spoofed email claiming to be
    from a given domain will generally fail SPF/DKIM because the attacker
    doesn't control that domain's real mail servers, regardless of whether
    the domain happens to be in any local whitelist.
    """
    header_lower = (auth_results_header or "").lower()
    return {
        'spf_pass':   'spf=pass'   in header_lower,
        'dkim_pass':  'dkim=pass'  in header_lower,
        'dmarc_pass': 'dmarc=pass' in header_lower,
        'header_present': bool(header_lower.strip()),
        'raw': auth_results_header or "",
    }


def check_brand_impersonation(sender: str, sender_domain: str) -> dict:
    """
    Flag cases where the display name claims a known brand but the sending
    domain does not belong to that brand — a classic spoofing pattern that
    a plain domain whitelist cannot catch (since the point is precisely that
    the actual domain is NOT the legitimate one).
    """
    display_name = _extract_display_name(sender)
    if not display_name:
        return {'impersonation_suspected': False}

    for brand, real_domain in KNOWN_BRANDS.items():
        if brand in display_name:
            if sender_domain != real_domain and not sender_domain.endswith('.' + real_domain):
                return {
                    'impersonation_suspected': True,
                    'claimed_brand': brand,
                    'expected_domain': real_domain,
                    'actual_domain': sender_domain,
                }
    return {'impersonation_suspected': False}


def predict_email(subject: str, body: str, sender: str = "", auth_results_header: str = "") -> dict:
    model = get_model_object()
    if model is None or _vectorizer is None:
        raise RuntimeError("Models not loaded. Run train.py first.")

    text = f"{subject} {body}".strip()

    # Sender domain + whitelist (fallback signal)
    sender_domain = _extract_sender_domain(sender)
    sender_whitelisted = _is_whitelisted(sender_domain)

    # Primary signals: header-based auth + impersonation heuristic
    auth = check_authentication(auth_results_header)
    impersonation = check_brand_impersonation(sender, sender_domain)

    text_series = pd.Series([text])
    features = build_features(text_series, _vectorizer)

    label = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = float(proba[label])

    # ── Signal 1: SPF/DKIM pass is strong evidence of legitimacy ──────────────
    # Trust it over the content model unless the model is near-certain,
    # covering the edge case of a legitimate-looking but compromised account.
    if auth['spf_pass'] and auth['dkim_pass'] and label == 1 and confidence < 0.97:
        label = 0
        confidence = float(proba[0])

    # ── Signal 2: whitelist fallback, only used when auth headers are absent ──
    # (e.g. .eml demo uploads, or providers that strip the header)
    elif not auth['header_present'] and sender_whitelisted and label == 1 and confidence < 0.97:
        label = 0
        confidence = float(proba[0])

    # ── Signal 3: brand impersonation escalates risk regardless of the above ──
    if impersonation['impersonation_suspected']:
        label = 1
        confidence = max(confidence, 0.9)

    if label == 1:
        risk = "high" if confidence >= 0.85 else "medium" if confidence >= 0.65 else "low"
    else:
        risk = "none"

    flags = _get_flags(text, sender_domain, sender_whitelisted, auth, impersonation)

    return {
        "label": label,
        "verdict": "phishing" if label == 1 else "legitimate",
        "confidence": round(confidence, 4),
        "risk_level": risk,
        "flags": flags,
        "model_used": _active_model_name,
        "sender_domain": sender_domain,
        "sender_whitelisted": sender_whitelisted,
        "auth_check": auth,
        "impersonation_check": impersonation,
    }


def _get_flags(text: str, sender_domain: str = "", whitelisted: bool = False,
                auth: dict = None, impersonation: dict = None) -> list:
    text_lower = text.lower()
    flags = []

    auth = auth or {}
    impersonation = impersonation or {}

    if auth.get('spf_pass') and auth.get('dkim_pass'):
        flags.append(f"SPF/DKIM verified for {sender_domain}")
    elif auth.get('header_present'):
        flags.append(f"SPF/DKIM check failed or incomplete for {sender_domain}")

    if impersonation.get('impersonation_suspected'):
        flags.append(
            f"Possible impersonation: display name claims '{impersonation['claimed_brand']}' "
            f"but domain is '{impersonation['actual_domain']}' (expected '{impersonation['expected_domain']}')"
        )

    if whitelisted and not auth.get('header_present'):
        flags.append(f"Sender domain in fallback whitelist: {sender_domain}")

    if text.count('http') > 2:
        flags.append(f"Contains {text.count('http')} URLs")

    if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', text):
        flags.append("Contains IP address (suspicious link)")

    urgent_found = [w for w in [
        'verify', 'urgent', 'suspended', 'confirm', 'password',
        'click', 'expire', 'validate', 'alert', 'winner', 'prize'
    ] if w in text_lower]
    if urgent_found:
        flags.append(f"Urgent keywords: {', '.join(urgent_found)}")

    upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if upper_ratio > 0.3:
        flags.append(f"High uppercase ratio ({upper_ratio:.0%})")

    if text.count('!') > 3:
        flags.append(f"Excessive exclamation marks ({text.count('!')})")

    if text.count('$') > 1:
        flags.append(f"Multiple dollar signs ({text.count('$')})")

    if 'click here' in text_lower:
        flags.append("Contains 'click here'")

    return flags