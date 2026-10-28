"""
FastAPI dependencies: current user extraction, role-based access control, tenant extraction.
"""
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import jwt

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from the Bearer token."""
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token turi noto'g'ri")
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ichida foydalanuvchi topilmadi")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token muddati tugagan")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token yaroqsiz")

    result = await db.execute(
        select(User).options(selectinload(User.tenant)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Foydalanuvchi topilmadi yoki bloklangan")
    return user


class RoleChecker:
    """Dependency factory for role-based access control."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu amaliyotga ruxsatingiz yo'q (talab qilinadigan rollar: {', '.join(self.allowed_roles)})",
            )
        return user


# Role checkers
require_super_admin = RoleChecker(["super_admin"])
require_admin = RoleChecker(["super_admin", "admin"])
require_cashier_or_admin = RoleChecker(["super_admin", "admin", "cashier"])
require_waiter_or_admin = RoleChecker(["super_admin", "admin", "cashier", "waiter"])
require_chef_or_admin = RoleChecker(["super_admin", "admin", "chef"])
require_courier_or_admin = RoleChecker(["super_admin", "admin", "courier"])
require_any_role = RoleChecker(["super_admin", "admin", "cashier", "chef", "waiter", "courier", "manager"])
