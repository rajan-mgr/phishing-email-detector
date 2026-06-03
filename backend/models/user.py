from extensions import db
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255))
    provider = db.Column(db.String(20), nullable=False)  # "google" or "outlook"
    provider_user_id = db.Column(db.String(255))
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    token_expiry = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('email', 'provider', name='uq_email_provider'),
    )

    scan_results = db.relationship("ScanResult", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "provider": self.provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
