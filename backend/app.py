import os
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import decode_token

from config import Config
from extensions import db, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from routes.auth_google import google_bp
    from routes.auth_outlook import outlook_bp
    from routes.scan import scan_bp
    from routes.history import history_bp

    app.register_blueprint(google_bp)
    app.register_blueprint(outlook_bp)
    app.register_blueprint(scan_bp)
    app.register_blueprint(history_bp)

    # Auth info endpoint
    @app.route("/auth/me")
    def auth_me():
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = auth_header.split(" ")[1]
        try:
            decoded = decode_token(token)
            user_id = decoded["sub"]
        except Exception:
            return jsonify({"error": "Invalid token"}), 419

        from models.user import User
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.to_dict())

    # Create database tables
    with app.app_context():
        from models import user, scan_result  # noqa: F401
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
