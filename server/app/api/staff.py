"""
Staff API — employee management by Restaurant Admin.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.auth import UserProfileOut, TenantOut

router = APIRouter(prefix="/staff", tags=["Staff"])


class StaffCreate(BaseModel):
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "cashier"  # admin | cashier | chef | waiter | courier | manager


class StaffUpdateBody(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class StaffOut(UserProfileOut):
    is_active: bool = True
    phone: Optional[str] = None


@router.get("/", response_model=List[StaffOut])
async def list_staff(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all staff members belonging to the current restaurant."""
    result = await db.execute(
        select(User).where(User.tenant_id == user.tenant_id).order_by(User.full_name)
    )
    users = result.scalars().all()
    return [
        StaffOut(
            user_id=u.id,
            username=u.username,
            full_name=u.full_name,
            phone=u.phone,
            role=u.role,
            is_active=u.is_active,
            tenant=TenantOut.model_validate(u.tenant) if u.tenant else None,
        )
        for u in users
    ]


@router.post("/", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
async def create_staff(
    body: StaffCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new staff member within the current restaurant."""
    # Check duplicate username
    existing = await db.execute(select(User).where(User.username == body.username.strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu username allaqachon mavjud")

    new_user = User(
        username=body.username.strip(),
        full_name=body.full_name.strip(),
        phone=body.phone,
        hashed_password=hash_password(body.password),
        role=body.role,
        tenant_id=admin.tenant_id,
        is_active=True,
    )
    db.add(new_user)

    audit = AuditLog(
        tenant_id=admin.tenant_id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="staff_created",
        resource_type="user",
        resource_id=new_user.id,
        details=f"Yangi xodim qo'shildi: {new_user.username} ({new_user.role})",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_user, attribute_names=["tenant"])

    return StaffOut(
        user_id=new_user.id,
        username=new_user.username,
        full_name=new_user.full_name,
        phone=new_user.phone,
        role=new_user.role,
        is_active=new_user.is_active,
        tenant=TenantOut.model_validate(new_user.tenant) if new_user.tenant else None,
    )


async def _perform_update(user_id: str, body: StaffUpdateBody, admin: User, db: AsyncSession):
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")

    if body.full_name is not None:
        target.full_name = body.full_name
    if body.phone is not None:
        target.phone = body.phone
    if body.role is not None:
        target.role = body.role
    if body.is_active is not None:
        target.is_active = body.is_active
    if body.password:
        target.hashed_password = hash_password(body.password)

    audit = AuditLog(
        tenant_id=admin.tenant_id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="staff_updated",
        resource_type="user",
        resource_id=target.id,
        details=f"Xodim tahrirlandi: {target.username} (faol: {target.is_active})",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(target, attribute_names=["tenant"])

    return StaffOut(
        user_id=target.id,
        username=target.username,
        full_name=target.full_name,
        phone=target.phone,
        role=target.role,
        is_active=target.is_active,
        tenant=TenantOut.model_validate(target.tenant) if target.tenant else None,
    )


@router.put("/{user_id}/", response_model=StaffOut)
async def update_staff_put(
    user_id: str,
    body: StaffUpdateBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _perform_update(user_id, body, admin, db)


@router.patch("/{user_id}/", response_model=StaffOut)
async def update_staff_patch(
    user_id: str,
    body: StaffUpdateBody,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _perform_update(user_id, body, admin, db)


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

    audit = AuditLog(
        tenant_id=admin.tenant_id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="staff_deleted",
        resource_type="user",
        resource_id=target.id,
        details=f"Xodim o'chirildi: {target.username}",
    )
    db.add(audit)

    await db.delete(target)
    await db.commit()
