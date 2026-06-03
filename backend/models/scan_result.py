from extensions import db
from datetime import datetime, timezone
import json


class ScanResult(db.Model):
    __tablename__ = "scan_results"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    email_id = db.Column(db.String(255))  # Gmail/Outlook message ID
    sender = db.Column(db.String(255))
    sender_domain = db.Column(db.String(255))
    subject = db.Column(db.Text)
    body_preview = db.Column(db.Text)
    verdict = db.Column(db.String(20))  # "phishing", "legitimate"
    confidence = db.Column(db.Float)
    risk_level = db.Column(db.String(20))  # "high", "medium", "low"
    flags = db.Column(db.Text)  # JSON list of flags
    has_attachments = db.Column(db.Boolean, default=False)
    url_count = db.Column(db.Integer, default=0)
    scanned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def get_flags(self):
        if self.flags:
            return json.loads(self.flags)
        return []

    def set_flags(self, flags_list):
        self.flags = json.dumps(flags_list)

    def to_dict(self):
        return {
            "id": self.id,
            "email_id": self.email_id,
            "sender": self.sender,
            "sender_domain": self.sender_domain,
            "subject": self.subject,
            "body_preview": self.body_preview,
            "verdict": self.verdict,
            "confidence": self.confidence,
            "risk_level": self.risk_level,
            "flags": self.get_flags(),
            "has_attachments": self.has_attachments,
            "url_count": self.url_count,
            "scanned_at": self.scanned_at.isoformat() if self.scanned_at else None,
        }
