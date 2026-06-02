from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

def analyze_audit(audit_result):
    prompt = f"""

    You are a website QA expert.
    Analyze this audit result:
    
    {audit_result}

    Return ONLY valid JSON in this format:

    {{
        "score": 0,
        "summary": "",
        "critical_issues": [
            {{
            "issue": "",
            "severity": "",
            "details": ""
            }}
        ],

        "warnings": [
            {{
            "issue": "",
            "details": ""
            }}
        ],

        "recommended_fixes": [
            ""
        ]
    }}

    Rules:
    - Return ONLY this schema.
    - Do not rename keys.
    - Do not add extra fields.
    - score must be between 0 and 100
    - critical_issues must be an array
    - warnings must be an array
    - recommended_fixes must be an array
    - return only JSON, no markdown
    """

    response = client.responses.create(
       model="gpt-5-mini",
        input=prompt
    )
    return json.loads(response.output_text)