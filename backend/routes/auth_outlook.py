from flask import Blueprint, redirect, session, jsonify, request
import msal
import requests
from flask_jwt_extended import create_access_token, decode_token
from datetime import datetime, timezone

from config import Config
from extensions import db
from models.user import User

outlook_bp = Blueprint("outlook", __name__)

AUTHORITY = f"https://login.microsoftonline.com/{Config.AZURE_TENANT_ID}"


def _build_msal_app():
    return msal.ConfidentialClientApplication(
        Config.AZURE_CLIENT_ID,
        client_credential=Config.AZURE_CLIENT_SECRET,
        authority=AUTHORITY,
    )


@outlook_bp.route("/auth/outlook")
def auth_outlook():
    msal_app = _build_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=Config.AZURE_SCOPES,
        redirect_uri=Config.AZURE_REDIRECT_URI,
    )
    return redirect(auth_url)


@outlook_bp.route("/auth/outlook/callback")
def auth_outlook_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No authorization code"}), 400

    msal_app = _build_msal_app()
    result = msal_app.acquire_token_by_authorization_code(
        code,
        scopes=Config.AZURE_SCOPES,
        redirect_uri=Config.AZURE_REDIRECT_URI,
    )

    if "error" in result:
        return jsonify({"error": result["error_description"]}), 400

    access_token = result["access_token"]
    refresh_token = result.get("refresh_token")

    # Get user info from Microsoft Graph
    user_info = _get_user_info(access_token)

    # Upsert user — query by email+provider to handle same email on different providers
    user = User.query.filter_by(email=user_info["mail"], provider="outlook").first()
    if not user:
        user = User(
            email=user_info["mail"],
            name=user_info.get("displayName", ""),
            provider="outlook",
            provider_user_id=user_info["id"],
        )
        db.session.add(user)

    user.access_token = access_token
    user.refresh_token = refresh_token
    db.session.commit()

    # Create JWT
    jwt_token = create_access_token(identity=str(user.id))

    # Redirect to frontend with token
    return redirect(f"http://localhost:5173?token={jwt_token}&provider=outlook")


def _get_user_info(access_token):
    resp = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    resp.raise_for_status()
    return resp.json()


@outlook_bp.route("/auth/outlook/me")
def outlook_me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    try:
        decoded = decode_token(token)
        user_id = decoded["sub"]
    except Exception:
        return jsonify({"error": "Invalid token"}), 419

    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict())
