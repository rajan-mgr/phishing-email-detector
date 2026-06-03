from flask import Blueprint, jsonify, request
from flask_jwt_extended import decode_token
from datetime import datetime, timezone, timedelta

from models.user import User
from models.scan_result import ScanResult

history_bp = Blueprint("history", __name__)


def _get_user_id():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_token(token)
        return int(decoded["sub"]), None, None
    except Exception:
        return None, jsonify({"error": "Invalid token"}), 419


def _days_filter(query, user_id):
    """Apply optional days filter to query."""
    days = request.args.get("days", type=int)
    base = ScanResult.query.filter_by(user_id=user_id)
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        base = base.filter(ScanResult.scanned_at >= cutoff)
    return base


@history_bp.route("/history")
def get_history():
    user_id, err, code = _get_user_id()
    if err:
        return err, code

    query = _days_filter(ScanResult.query, user_id)
    results = query.order_by(ScanResult.scanned_at.desc()).limit(500).all()

    return jsonify({
        "total": len(results),
        "results": [r.to_dict() for r in results],
    })


@history_bp.route("/history/stats")
def get_stats():
    user_id, err, code = _get_user_id()
    if err:
        return err, code

    query = _days_filter(ScanResult.query, user_id)
    results = query.all()

    total = len(results)
    phishing = sum(1 for r in results if r.verdict == "phishing")
    legitimate = total - phishing
    high_risk = sum(1 for r in results if r.risk_level == "high")
    medium_risk = sum(1 for r in results if r.risk_level == "medium")

    phishing_domains = {}
    for r in results:
        if r.verdict == "phishing" and r.sender_domain:
            phishing_domains[r.sender_domain] = phishing_domains.get(r.sender_domain, 0) + 1

    top_domains = sorted(phishing_domains.items(), key=lambda x: x[1], reverse=True)[:10]

    return jsonify({
        "total_scanned": total,
        "phishing_count": phishing,
        "legitimate_count": legitimate,
        "phishing_rate": round(phishing / total * 100, 1) if total > 0 else 0,
        "high_risk_count": high_risk,
        "medium_risk_count": medium_risk,
        "top_phishing_domains": [{"domain": d, "count": c} for d, c in top_domains],
    })
