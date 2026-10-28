"""
Auth API — login, register, refresh, profile, and password management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.models.audit import AuditLog
from app.schemas.auth import (
    LoginRequest, RegisterRequest, TokenResponse, RefreshRequest,
    LoginResponse, UserProfileOut, TenantOut,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_to_profile(user: User) -> UserProfileOut:
    return UserProfileOut(
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        tenant=TenantOut.model_validate(user.tenant) if user.tenant else None,
    )


@router.post("/login/", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens + profile."""
    result = await db.execute(
        select(User).options(selectinload(User.tenant)).where(User.username == body.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Noto'g'ri login yoki parol",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Foydalanuvchi bloklangan",
        )

    # Check tenant status if not super_admin
    if user.tenant and user.tenant.status == "suspended" and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restoran faoliyati vaqtincha to'xtatilgan. Administratorga murojaat qiling.",
        )

    tokens = TokenResponse(
        access=create_access_token({"sub": user.id, "role": user.role, "tenant": user.tenant_id}),
        refresh=create_refresh_token({"sub": user.id}),
    )

    # Record audit log
    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        user_name=user.full_name,
        action="login",
        resource_type="auth",
        resource_id=user.id,
        details=f"Foydalanuvchi {user.username} tizimga kirdi ({user.role})",
    )
    db.add(audit)
    await db.commit()

    return LoginResponse(tokens=tokens, user=_user_to_profile(user))


# Alias for JWT token endpoint
@router.post("/token/", response_model=TokenResponse)
async def login_for_access_token(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """OAuth2/JWT token exchange endpoint."""
    res = await login(body, db)
    return res.tokens


@router.post("/register/", response_model=UserProfileOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user or owner."""
    # Prevent unauthorized super_admin registration
    if body.role == "super_admin":
        user_count = await db.scalar(select(User.id))
        if user_count:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super Admin ro'yxatdan o'tishi faqat tizim sozlashda ruxsat etiladi",
            )

    # Check duplicate username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu username allaqachon mavjud")

    # If tenant_id provided, verify tenant exists
    if body.tenant_id:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == body.tenant_id))
        tenant = tenant_result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant topilmadi")

    user = User(
        username=body.username,
        full_name=body.full_name,
        phone=body.phone,
        hashed_password=hash_password(body.password),
        role=body.role,
        tenant_id=body.tenant_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["tenant"])

    return _user_to_profile(user)


@router.post("/token/refresh/", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    try:
        payload = decode_token(body.refresh)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token turi noto'g'ri")

        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")

        return TokenResponse(
            access=create_access_token({"sub": user.id, "role": user.role, "tenant": user.tenant_id}),
            refresh=create_refresh_token({"sub": user.id}),
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh token yaroqsiz")


@router.get("/me/", response_model=UserProfileOut)
async def get_profile(user: User = Depends(get_current_user)):
    """Return current user profile."""
    return _user_to_profile(user)
