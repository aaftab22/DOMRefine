def calculate_scores(audit_result):
    errors = audit_result.get("errors", [])
    warnings = audit_result.get("warnings", [])

    overall_score = 100

    category_scores = {
        "user_facing": 100,
        "security": 100,
        "accessibility": 100,
        "technical": 100,
        "seo": 100
    }

    for error in errors:
        issue_type = error.get("type")

        if issue_type == "Mobile Element Overflow":
            category_scores["user_facing"] -= 15

        elif issue_type == "Broken Images":
            category_scores["technical"] -= 15

        elif issue_type == "Broken Internal Pages":
            category_scores["technical"] -= 15

    for warning in warnings:
        issue_type = warning.get("type")

        if issue_type == "Missing Security Headers":
            category_scores["security"] -= 10

        elif issue_type == "Inputs Without Labels":
            category_scores["accessibility"] -= 10

        elif issue_type == "Multiple H1":
            category_scores["seo"] -= 10

    for category in category_scores:
        category_scores[category] = max(20, min(100, category_scores[category]))

    overall_score = sum(category_scores.values()) // len(category_scores)

    return {
        "overall_score": overall_score,
        "category_scores": category_scores,
        "critical_issues": errors,
        "warnings": warnings,
        "recommended_fixes": []
    }