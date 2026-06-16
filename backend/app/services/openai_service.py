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
            "overall_score": 0,

            "category_scores": {
                "user_facing": 0,
                "security": 0,
                "accessibility": 0,
                "technical": 0,
                "seo": 0
            },

            "summary": "",

            "errors": [
                {
                    "issue": "",
                    "severity": "",
                    "details": ""
                }
            ],

            "warnings": [
                {
                    "issue": "",
                    "severity": "",
                    "details": ""
                }
            ],

            "recommended_fixes": [
                ""
            ],

            "analysis_source": "ai"
        }}

    Rules:
    - Return ONLY this schema.
    - Do not rename keys.
    - Do not add extra fields.
    - overall_score must be between 0 and 100
    - each category score must be between 0 and 100
    - errors must be an array
    - warnings must be an array
    - severity must be one of: critical, high, medium, low
    - recommended_fixes must be an array
    - analysis_source must remain "ai"
    - return only JSON, no markdown
    """

    response = client.responses.create(
       model="gpt-5-mini",
        input=prompt
    )
    return json.loads(response.output_text)