from fastapi import APIRouter
from app.services.playwright_service import capture_screenshot
router = APIRouter()

@router.get("/audit")
def audit(url: str):
    audit_result = capture_screenshot(url)
    
    return {
        "Entered url": url,
        "audit": audit_result
    }