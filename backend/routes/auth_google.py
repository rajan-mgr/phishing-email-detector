from flask import Blueprint, redirect, session, jsonify
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from flask_jwt_extended import create_access_token
from datetime import datetime, timezone

from config import Config
from extensions import db
from models.user import User

google_bp = Blueprint("google", __name__)


def _build_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": Config.GOOGLE_CLIENT_ID,
                "client_secret": Config.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=" ".join(Config.GOOGLE_SCOPES),
        redirect_uri=Config.GOOGLE_REDIRECT_URI,
    )


@google_bp.route("/auth/google")
def auth_google():
    flow = _build_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    session["oauth_state"] = state
    return redirect(authorization_url)


@google_bp.route("/auth/google/callback")
def auth_google_callback():
    flow = _build_flow()
    flow.fetch_token(authorization_response=authorization_url_from_request())

    credentials = flow.credentials
    user_info = _get_user_info(credentials)

    # Upsert user — query by email+provider to handle same email on different providers
    user = User.query.filter_by(email=user_info["email"], provider="google").first()
    if not user:
        user = User(
            email=user_info["email"],
            name=user_info.get("name", ""),
            provider="google",
            provider_user_id=user_info["id"],
        )
        db.session.add(user)

    user.access_token = credentials.token
    user.refresh_token = credentials.refresh_token
    if credentials.expiry:
        user.token_expiry = credentials.expiry.replace(tzinfo=timezone.utc)
    db.session.commit()

    # Create JWT
    access_token = create_access_token(identity=str(user.id))

    # Redirect to frontend with token
    return redirect(f"http://localhost:5173?token={access_token}&provider=google")


def authorization_url_from_request():
    from flask import request
    return request.url


def _get_user_info(credentials):
    service = build("oauth2", "v2", credentials=credentials)
    return service.userinfo().get().execute()


@google_bp.route("/auth/google/me")
def google_me():
    from flask_jwt_extended import jwt_required, get_jwt_identity
    from flask import request

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing token"}), 401

    from flask_jwt_extended import decode_token
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
