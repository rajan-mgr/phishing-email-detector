from flask import Blueprint, jsonify, request
from flask_jwt_extended import decode_token
import requests as http_requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from config import Config
from extensions import db
from models.user import User
from models.scan_result import ScanResult
from ml.predict import predict_email, set_active_model, get_model_info

scan_bp = Blueprint("scan", __name__)


def _get_user_from_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_token(token)
        user_id = decoded["sub"]
    except Exception:
        return None, jsonify({"error": "Invalid token"}), 419

    user = User.query.get(int(user_id))
    if not user:
        return None, jsonify({"error": "User not found"}), 404

    return user, None, None


@scan_bp.route("/scan", methods=["POST"])
def scan_emails():
    user, err, code = _get_user_from_token()
    if err:
        return err, code

    if user.provider == "google":
        emails = _fetch_gmail_emails(user)
    elif user.provider == "outlook":
        emails = _fetch_outlook_emails(user)
    else:
        return jsonify({"error": "Unknown provider"}), 400

    if isinstance(emails, dict) and "error" in emails:
        return jsonify(emails), 500

    results = []
    for email_data in emails:
        prediction = predict_email(
            email_data["subject"],
            email_data["body"],
            sender=email_data.get("sender", "")
        )

        scan_result = ScanResult(
            user_id=user.id,
            email_id=email_data.get("id"),
            sender=email_data.get("sender", ""),
            sender_domain=_extract_domain(email_data.get("sender", "")),
            subject=email_data.get("subject", ""),
            body_preview=email_data.get("body", "")[:500],
            verdict=prediction["verdict"],
            confidence=prediction["confidence"],
            risk_level=prediction["risk_level"],
            has_attachments=email_data.get("has_attachments", False),
            url_count=email_data.get("body", "").count("http"),
        )
        scan_result.set_flags(prediction["flags"])
        db.session.add(scan_result)
        results.append(scan_result.to_dict())

    db.session.commit()

    return jsonify({
        "total_scanned": len(results),
        "phishing_count": sum(1 for r in results if r["verdict"] == "phishing"),
        "legitimate_count": sum(1 for r in results if r["verdict"] == "legitimate"),
        "results": results,
    })


@scan_bp.route("/scan/quick", methods=["POST"])
def quick_scan():
    """Scan a single email provided in the request body."""
    data = request.get_json()
    if not data or "subject" not in data or "body" not in data:
        return jsonify({"error": "subject and body required"}), 400

    prediction = predict_email(
        data["subject"],
        data["body"],
        sender=data.get("sender", "")
    )
    return jsonify(prediction)


def _extract_domain(sender):
    """Extract domain from email address."""
    if "@" in sender:
        return sender.split("@")[-1].strip(">").strip()
    return ""


def _fetch_gmail_emails(user, max_results=50):
    """Fetch recent emails using Gmail API."""
    try:
        credentials = Credentials(
            token=user.access_token,
            refresh_token=user.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=Config.GOOGLE_CLIENT_ID,
            client_secret=Config.GOOGLE_CLIENT_SECRET,
        )

        service = build("gmail", "v1", credentials=credentials)
        messages_list = service.users().messages().list(
            userId="me", maxResults=max_results
        ).execute()

        messages = messages_list.get("messages", [])
        emails = []

        for msg in messages:
            msg_data = service.users().messages().get(
                userId="me", id=msg["id"], format="full"
            ).execute()

            headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
            body = _extract_gmail_body(msg_data.get("payload", {}))

            emails.append({
                "id": msg["id"],
                "sender": headers.get("From", ""),
                "subject": headers.get("Subject", ""),
                "body": body,
                "has_attachments": any(
                    p.get("filename") for p in msg_data.get("payload", {}).get("parts", [])
                ),
            })

        return emails

    except Exception as e:
        return {"error": f"Gmail API error: {str(e)}"}


def _extract_gmail_body(payload):
    """Recursively extract text body from Gmail message payload."""
    import base64

    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        result = _extract_gmail_body(part)
        if result:
            return result

    # Fallback: try body.data directly
    if payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")

    return ""


def _fetch_outlook_emails(user, max_results=50):
    """Fetch recent emails using Microsoft Graph API."""
    try:
        resp = http_requests.get(
            f"https://graph.microsoft.com/v1.0/me/messages?$top={max_results}&$select=id,from,subject,body,hasAttachments",
            headers={"Authorization": f"Bearer {user.access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()

        emails = []
        for msg in data.get("value", []):
            body_content = msg.get("body", {}).get("content", "")
            # Strip HTML tags for text extraction
            import re
            body_text = re.sub(r"<[^>]+>", " ", body_content)
            body_text = re.sub(r"\s+", " ", body_text).strip()

            emails.append({
                "id": msg["id"],
                "sender": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                "subject": msg.get("subject", ""),
                "body": body_text,
                "has_attachments": msg.get("hasAttachments", False),
            })

        return emails

    except Exception as e:
        return {"error": f"Graph API error: {str(e)}"}


@scan_bp.route("/model/status", methods=["GET"])
def model_status():
    """Get current active model info."""
    return jsonify(get_model_info())


@scan_bp.route("/model/switch", methods=["POST"])
def model_switch():
    """Switch the active ML model."""
    data = request.get_json()
    if not data or "model" not in data:
        return jsonify({"error": "model required ('lr' or 'rf')"}), 400

    model_name = data["model"]
    try:
        set_active_model(model_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"success": True, "active": model_name})
