from fastapi import APIRouter
from app.services.playwright_service import capture_screenshot
from app.services.openai_service import analyze_audit
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database.db import get_db
from app.models.audit_model import Audit

router = APIRouter()

@router.get("/audit")
def audit(url: str, db: Session = Depends(get_db)):
    audit_result = capture_screenshot(url)
    db_audit = Audit(
        url=url,
        audit_json=audit_result,
        # ai_analysis=gpt_analysis
    )
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)

    # gpt_analysis = analyze_audit(audit_result)

    # print(gpt_analysis)

    return {
        "id": db_audit.id,
        "Entered url": url,
        "audit": audit_result,
        # "analysis": gpt_analysis
        "created_at": db_audit.created_at
    }