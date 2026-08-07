from app import create_app
from extensions import db
from models.scan_result import ScanResult

app = create_app()

with app.app_context():
    deleted = ScanResult.query.delete()
    db.session.commit()
    print(f"Deleted {deleted} old scan results")