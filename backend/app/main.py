from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
# Import các routes
from app.api.routes import explain as explain_route
from app.api.routes import search as search_route
from app.api.routes import grammar as grammar_route
from app.api.routes import rewrite as rewrite_route

# 1. Cấu hình Rate Limiting (Chống spam)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Context-Aware Reading & Writing Assistant API",
    version="0.1.0",
    description="Backend cho Chrome Extension SDS Nhóm 20",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. Cấu hình CORS
# Cho phép Extension (chrome-extension://) và Localhost (nếu chạy test UI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Middleware Bảo mật: Kiểm tra Secret Token
SECRET_TOKEN = "CAA_NHOM20_SECRET_2026" # Có thể đưa vào file .env

@app.middleware("http")
async def verify_token(request: Request, call_next):
    # Bỏ qua kiểm tra token đối với các route public (Health check, Swagger Docs)
    public_paths = ["/health", "/api/health", "/docs", "/openapi.json", "/redoc"]
    if request.url.path in public_paths:
        return await call_next(request)
        
    # Kiểm tra Header X-Extension-Token
    token = request.headers.get("X-Extension-Token")
    if token != SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing token")
        
    return await call_next(request)

# 4. Đăng ký các routes
app.include_router(explain_route.router, prefix="/api")
app.include_router(search_route.router, prefix="/api")
app.include_router(grammar_route.router, prefix="/api")
app.include_router(rewrite_route.router, prefix="/api")

# 5. Health check
@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok", "provider": settings.ai_provider_name}

@app.get("/api/health", tags=["system"])
async def api_health() -> dict:
    return {"status": "ok", "provider": settings.ai_provider_name}