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
LEGITIMATE_DOMAINS = {
    'github.com', 'gitlab.com', 'bitbucket.org',
    'google.com', 'gmail.com', 'googlemail.com',
    'microsoft.com', 'outlook.com', 'hotmail.com', 'live.com',
    'apple.com', 'icloud.com',
    'amazon.com', 'aws.amazon.com',
    'facebook.com', 'instagram.com', 'whatsapp.com',
    'twitter.com', 'x.com',
    'linkedin.com', 'slack.com', 'discord.com',
    'twitch.tv', 'youtube.com', 'netflix.com',
    'spotify.com', 'steam.com', 'epicgames.com',
    'reddit.com', 'stackoverflow.com', 'stackexchange.com',
    'notion.so', 'figma.com', 'canva.com',
    'miro.com', 'trello.com', 'asana.com',
    'dropbox.com', 'box.com',
    'paypal.com', 'stripe.com', 'square.com',
    'huggingface.co', 'openai.com',
    'pinterest.com', 'tumblr.com',
    'zoom.us', 'teams.microsoft.com',
    'adobe.com', 'salesforce.com',
    'ibm.com', 'oracle.com', 'sap.com',
    'cisco.com', 'intel.com', 'nvidia.com',
    'dell.com', 'hp.com', 'lenovo.com',
    'samsung.com', 'sony.com',
    'medium.com', 'substack.com',
    'coursera.org', 'udemy.com', 'edx.org',
    'wikipedia.org', 'wikimedia.org',
    'mozilla.org', 'firefox.com',
    'brave.com', 'opera.com',
    'vivaldi.com', 'edge.microsoft.com',
}

# ── Active model state ────────────────────────────────────────────────────────
_active_model_name = "rf"  # "lr" or "rf"
_model_lr = None
_model_rf = None
_vectorizer = None


def _load_models():
    global _model_lr, _model_rf, _vectorizer
    try:
        _model_lr = joblib.load(MODEL_LR)
        _model_rf = joblib.load(MODEL_RF)
        _vectorizer = load_vectorizer()
        print("Models and vectorizer loaded")
    except FileNotFoundError as e:
        print(f"Warning: {e}")


def get_active_model():
    return _active_model_name


def set_active_model(name):
    global _active_model_name
    if name not in ("lr", "rf"):
        raise ValueError("Model must be 'lr' or 'rf'")
    _active_model_name = name


def get_model_object():
    if _active_model_name == "lr":
        return _model_lr
    return _model_rf


def get_model_info():
    """Return info about both models for the API."""
    return {
        "active": _active_model_name,
        "models": {
            "lr": {
                "name": "Logistic Regression",
                "loaded": _model_lr is not None,
            },
            "rf": {
                "name": "Random Forest",
                "loaded": _model_rf is not None,
            },
        }
    }


# Load on import
_load_models()


def _extract_domains(text: str) -> set:
    domain_pattern = r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b'
    domains = re.findall(domain_pattern, text.lower())
    return set(domains)


def _is_whitelisted_domain(text: str) -> bool:
    domains = _extract_domains(text)
    for domain in domains:
        parts = domain.split('.')
        for i in range(len(parts) - 1):
            parent = '.'.join(parts[i:])
            if parent in LEGITIMATE_DOMAINS:
                return True
    return False


def predict_email(subject: str, body: str, sender: str = "") -> dict:
    model = get_model_object()
    if model is None or _vectorizer is None:
        raise RuntimeError("Models not loaded. Run train.py first.")

    text = f"{subject} {body}".strip()

    sender_whitelisted = _is_whitelisted_domain(sender) if sender else False

    text_series = pd.Series([text])
    features = build_features(text_series, _vectorizer)

    label = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = float(proba[label])

    if sender_whitelisted and label == 1 and confidence < 0.95:
        label = 0
        confidence = float(proba[0])

    if label == 1:
        if confidence >= 0.85:
            risk = "high"
        elif confidence >= 0.65:
            risk = "medium"
        else:
            risk = "low"
    else:
        risk = "low"

    flags = _get_flags(text)

    return {
        "label": label,
        "verdict": "phishing" if label == 1 else "legitimate",
        "confidence": round(confidence, 4),
        "risk_level": risk,
        "flags": flags,
        "model_used": _active_model_name,
    }


def _get_flags(text: str) -> list:
    text_lower = text.lower()
    flags = []

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
