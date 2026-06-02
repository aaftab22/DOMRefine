from fastapi import APIRouter
from app.services.playwright_service import capture_screenshot
from app.services.openai_service import analyze_audit

router = APIRouter()

@router.get("/audit")
def audit(url: str):
    audit_result = capture_screenshot(url)
    
    gpt_analysis = analyze_audit(audit_result)

    print(gpt_analysis)

    return {
        "Entered url": url,
        "audit": audit_result,
        "analysis": gpt_analysis
    }