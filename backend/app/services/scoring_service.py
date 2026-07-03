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

    # ── Severity map ──────────────────────────────────────────────────────────
    # Every issue type produced by the audit engines must have an entry here.
    # Severity drives the default display badge on the frontend.
    # When adding a new audit check, add its type string here too.
    # ─────────────────────────────────────────────────────────────────────────
    SEVERITY_MAP = {
        # User-Facing
        "Broken Images":               "high",
        "Broken Internal Pages":       "high",
        "Mobile Scroll Overflow":      "high",
        "Mobile Element Overflow":     "high",
        "Mobile Overlapping Elements": "medium",
        "Tablet Scroll Overflow":      "medium",
        "Tablet Element Overflow":     "medium",
        "Desktop Scroll Overflow":     "medium",
        "Desktop Element Overflow":    "medium",
        "Broken Anchor Links":         "medium",
        "Unverifiable Internal Pages": "low",

        # Technical
        "Console Errors":              "high",

        # Security
        "Missing Security Headers":    "high",

        # Accessibility
        "Missing Alt Tags":            "medium",
        "Duplicate IDs":               "medium",
        "Inputs Without Labels":       "high",

        # SEO
        "Missing Page Title":          "high",
        "Missing Meta Description":    "medium",
        "Missing H1":                  "high",
        "Multiple H1":                 "low",
        "No Headings":                 "medium",
        "Empty Links":                 "low",
    }

    # ── Deduction map ─────────────────────────────────────────────────────────
    # Maps every issue type to (category, points_deducted).
    # Category must match a key in category_scores.
    # When adding a new audit check, add an entry below with the appropriate
    # category and a deduction that reflects severity (High ~15-20, Med ~10, Low ~5).
    # ─────────────────────────────────────────────────────────────────────────
    DEDUCTION_MAP = {
        # User-Facing — layout and navigability issues
        "Broken Images":               ("user_facing", 15),
        "Broken Internal Pages":       ("user_facing", 20),
        "Mobile Scroll Overflow":      ("user_facing", 15),
        "Mobile Element Overflow":     ("user_facing", 15),
        "Mobile Overlapping Elements": ("user_facing", 10),
        "Tablet Scroll Overflow":      ("user_facing", 10),
        "Tablet Element Overflow":     ("user_facing", 10),
        "Desktop Scroll Overflow":     ("user_facing", 10),
        "Desktop Element Overflow":    ("user_facing", 10),
        "Broken Anchor Links":         ("user_facing", 10),
        "Unverifiable Internal Pages": ("user_facing",  5),

        # Technical — runtime and script errors
        "Console Errors":              ("technical",   15),

        # Security — missing HTTP headers
        "Missing Security Headers":    ("security",    20),

        # Accessibility — WCAG compliance
        "Missing Alt Tags":            ("accessibility", 10),
        "Duplicate IDs":               ("accessibility", 10),
        "Inputs Without Labels":       ("accessibility", 15),

        # SEO — discoverability and structure
        "Missing Page Title":          ("seo", 20),
        "Missing Meta Description":    ("seo", 10),
        "Missing H1":                  ("seo", 15),
        "Multiple H1":                 ("seo",  5),
        "No Headings":                 ("seo", 10),
        "Empty Links":                 ("seo",  5),
    }

    # Apply deductions for every detected issue (errors and warnings share the same map)
    for issue in raw_errors + raw_warnings:
        issue_type = issue.get("type")
        if issue_type in DEDUCTION_MAP:
            category, points = DEDUCTION_MAP[issue_type]
            category_scores[category] -= points

    # Clamp scores to the range [20, 100] — no category can floor below 20
    for category in category_scores:
        category_scores[category] = max(20, min(100, category_scores[category]))

    overall_score = sum(category_scores.values()) // len(category_scores)

    # Build structured issue lists — severity is now always explicit, never a default
    errors = [
        {
            "category": e["category"],
            "issue":    e["type"],
            "severity": SEVERITY_MAP.get(e["type"], "medium"),
            "details":  str(e["details"])
        }
        for e in raw_errors
    ]

    warnings = [
        {
            "category": w["category"],
            "issue":    w["type"],
            "severity": SEVERITY_MAP.get(w["type"], "low"),
            "details":  str(w["details"])
        }
        for w in raw_warnings
    ]

    return {
        "overall_score":    overall_score,
        "category_scores":  category_scores,
        "summary":          "Backup scoring used because AI analysis was unavailable.",
        "errors":           errors,
        "warnings":         warnings,
        "recommended_fixes": [],
        "analysis_source":  "manual"
    }