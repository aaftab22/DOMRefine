def check_security_headers(response):
    headers = response.headers

    findings = []

    if "content-security-policy" not in headers:
        findings.append("Missing content security policy")

    if headers.get("x-content-type-options", "").lower() != "nosniff":
        findings.append("Missing x-content-type-options (nosniff)")

    if (
        "x-frame-options" not in headers and
        "frame-ancestors" not in headers.get("content-security-policy", "").lower()
    ):
        findings.append("Missing Clickjacking Protection")

    if "referrer-policy" not in headers:
        findings.append("Missing referer-policy")

    return findings