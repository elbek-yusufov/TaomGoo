"""
TaomGo Backend — FastAPI main application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.deps import get_current_user
from app.models.user import User

# Import all models to ensure mapper registries are loaded
import app.models  # noqa: F401

# Import routers
from app.api.auth import router as auth_router, _user_to_profile
from app.api.menu import router as menu_router
from app.api.tables import router as tables_router
from app.api.orders import router as orders_router
from app.api.inventory import router as inventory_router
from app.api.finance import router as finance_router
from app.api.staff import router as staff_router
from app.api.super_admin import router as super_admin_router
from app.api.delivery import router as delivery_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup (dev only, use Alembic in production)."""
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="TaomGo API",
    description="Restoran boshqaruv tizimi — POS, Oshxona KDS, Ombor, Moliya, Ofitsiant, Kuryer va Super Admin",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
API_V1 = "/api/v1"
app.include_router(auth_router, prefix=API_V1)
app.include_router(menu_router, prefix=API_V1)
app.include_router(tables_router, prefix=API_V1)
app.include_router(orders_router, prefix=API_V1)
app.include_router(inventory_router, prefix=API_V1)
app.include_router(finance_router, prefix=API_V1)
app.include_router(staff_router, prefix=API_V1)
app.include_router(super_admin_router, prefix=API_V1)
app.include_router(delivery_router, prefix=API_V1)


# Compatibility alias for profile endpoint
@app.get("/api/v1/profile/")
async def legacy_profile(user: User = Depends(get_current_user)):
    return _user_to_profile(user)


@app.get("/")
async def root():
    return {
        "message": "TaomGo Production RMS API ishlayapti! 🍽️",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "TaomGo RMS"}
