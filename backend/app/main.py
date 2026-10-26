"""Entry point FastAPI cho Context-Aware Assistant Backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import explain as explain_route
from app.api.routes import search as search_route
from app.core.config import settings
from app.api.routes import grammar as grammar_route
from app.api.routes import rewrite as rewrite_route

app = FastAPI(
    title="Context-Aware Reading & Writing Assistant API",
    version="0.1.0",
    description="Backend cho Chrome Extension SDS Nhóm 20",
)

# CORS — cho phép Extension gọi từ chrome-extension://
origins = settings.allowed_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(explain_route.router, prefix="/api")
app.include_router(search_route.router, prefix="/api") 
app.include_router(grammar_route.router, prefix="/api")
app.include_router(rewrite_route.router, prefix="/api")

@app.get("/health", tags=["system"])
async def health() -> dict:
    """Health check — dùng để verify server chạy."""
    return {"status": "ok", "provider": settings.ai_provider_name}


@app.get("/api/health", tags=["system"])
async def api_health() -> dict:
    """Health check dưới prefix /api (để Extension dễ gọi)."""
    return {"status": "ok", "provider": settings.ai_provider_name}