"""
Staff API — user (xodim) management by admin.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import UserProfileOut, TenantOut

router = APIRouter(prefix="/staff", tags=["Staff"])


class StaffCreate:
    pass  # using RegisterRequest for creation


class StaffOut(UserProfileOut):
    is_active: bool = True


@router.get("/", response_model=List[StaffOut])
async def list_staff(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.tenant_id == user.tenant_id).order_by(User.full_name)
    )
    users = result.scalars().all()
    return [
        StaffOut(
            user_id=u.id,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            tenant=TenantOut.model_validate(u.tenant),
        )
        for u in users
    ]


from pydantic import BaseModel
from typing import Optional


class StaffUpdateBody(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


@router.put("/{user_id}/", response_model=StaffOut)
async def update_staff(
    user_id: str,
    body: StaffUpdateBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")

    if body.full_name is not None:
        target.full_name = body.full_name
    if body.role is not None:
        target.role = body.role
    if body.is_active is not None:
        target.is_active = body.is_active
    if body.password:
        target.hashed_password = hash_password(body.password)

    await db.commit()
    await db.refresh(target, attribute_names=["tenant"])

    return StaffOut(
        user_id=target.id,
        username=target.username,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        tenant=TenantOut.model_validate(target.tenant),
    )


@router.delete("/{user_id}/", status_code=204)
async def delete_staff(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")

    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")

    await db.delete(target)
    await db.commit()
