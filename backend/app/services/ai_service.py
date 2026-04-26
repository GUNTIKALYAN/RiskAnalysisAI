from groq import Groq
from app.core.config import GROQ_API_KEY
import concurrent.futures

client = Groq(api_key=GROQ_API_KEY)

def generate_ai_analysis(score, band, factors):
    factor_text = "\n".join([f"- {f['factor']}" for f in factors])

    prompt = f"""
You are a financial risk analyst.

Risk Score: {score}
Risk Band: {band}

Key Factors:
{factor_text}

Write a clear explanation:
- Explain why the business is {band}
- Refer ONLY to the listed factors
- Do NOT mention any external models, theories, or frameworks
- Do NOT assume anything beyond the given data

Keep it concise (5–6 sentences).
"""
    
    def call_api():
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    try:
        # Timeout = 3 seconds per AI call
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(call_api)
            return future.result(timeout=3)

    except concurrent.futures.TimeoutError:
        return "AI explanation unavailable due to timeout"

    except Exception as e:
        return f"AI error: {str(e)}"