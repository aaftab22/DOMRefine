def calculate_scores(audit_result):
    raw_errors = audit_result.get("errors", [])
    raw_warnings = audit_result.get("warnings", [])

    category_scores = {
        "user_facing": 100,
        "security": 100,
        "accessibility": 100,
        "technical": 100,
        "seo": 100
    }

    SEVERITY_MAP = {
        "Mobile Element Overflow": "high",
        "Broken Images": "medium",
        "Broken Internal Pages": "high",
        "Missing Security Headers": "medium",
        "Inputs Without Labels": "medium",
        "Multiple H1": "low"
    }

    for error in raw_errors:
        issue_type = error.get("type")

        if issue_type == "Mobile Element Overflow":
            category_scores["user_facing"] -= 15

        elif issue_type == "Broken Images":
            category_scores["technical"] -= 15

        elif issue_type == "Broken Internal Pages":
            category_scores["technical"] -= 15

    for warning in raw_warnings:
        issue_type = warning.get("type")

        if issue_type == "Missing Security Headers":
            category_scores["security"] -= 10

        elif issue_type == "Inputs Without Labels":
            category_scores["accessibility"] -= 10

        elif issue_type == "Multiple H1":
            category_scores["seo"] -= 10

    for category in category_scores:
        category_scores[category] = max(
            20,
            min(100, category_scores[category])
        )

    overall_score = sum(category_scores.values()) // len(category_scores)

    errors = [
        {
            "category": e["category"],
            "issue": e["type"],
            "severity": SEVERITY_MAP.get(e["type"], "medium"),
            "details": str(e["details"])
        }
        for e in raw_errors
    ]

    warnings = [
        {
            "category": w["category"],
            "issue": w["type"],
            "severity": SEVERITY_MAP.get(w["type"], "low"),
            "details": str(w["details"])
        }
        for w in raw_warnings
    ]

    return {    
        "overall_score": overall_score,
        "category_scores": category_scores,
        "summary": "Backup scoring used because AI analysis was unavailable.",
        "errors": errors,
        "warnings": warnings,
        "recommended_fixes": [],
        "analysis_source": "manual"
    }