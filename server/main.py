"""
TaomGo Backend — FastAPI main application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base

# Import all models so they register with Base.metadata
from app.models import tenant, user, menu, order, inventory  # noqa: F401

# Import routers
from app.api.auth import router as auth_router
from app.api.menu import router as menu_router
from app.api.tables import router as tables_router
from app.api.orders import router as orders_router
from app.api.inventory import router as inventory_router
from app.api.finance import router as finance_router
from app.api.staff import router as staff_router


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
    description="Restoran boshqaruv tizimi — POS, Oshxona KDS, Ombor, Moliya",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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


@app.get("/")
async def root():
    return {"message": "TaomGo API ishlayapti! 🍽️", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
