import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# .env của bạn có thể chứa nhiều key cách nhau dấu phẩy -> lấy key đầu tiên
key = os.getenv("GEMINI_API_KEY", "").split(",")[0].strip()
client = genai.Client(api_key=key)

for m in client.models.list():
    actions = m.supported_actions or []
    if "generateContent" in actions:
        print(m.name)