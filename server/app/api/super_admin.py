"""
Super Admin API — Multi-tenant platform management, restaurants, plans, and audit logs.
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import require_super_admin
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User
from app.models.order import Order
from app.models.audit import AuditLog

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


# Schemas
class TenantCreateRequest(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = "so'm"
    subscription_plan: Optional[str] = "pro"
    # Initial admin details
    owner_username: str
    owner_full_name: str
    owner_password: str
    owner_phone: Optional[str] = None


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = None
    status: Optional[str] = None  # active | suspended
    subscription_plan: Optional[str] = None


class TenantListItem(BaseModel):
    id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    currency: str
    status: str
    subscription_plan: str
    users_count: int
    orders_count: int
    total_revenue: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class PlatformStats(BaseModel):
    total_restaurants: int
    active_restaurants: int
    suspended_restaurants: int
    total_users: int
    total_orders: int
    total_platform_revenue: float


class AuditLogItem(BaseModel):
    id: str
    tenant_id: Optional[str]
    user_name: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/stats/", response_model=PlatformStats)
async def get_platform_stats(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide summary for Super Admin dashboard."""
    total_restaurants = await db.scalar(select(func.count(Tenant.id))) or 0
    active_restaurants = await db.scalar(select(func.count(Tenant.id)).where(Tenant.status == "active")) or 0
    suspended_restaurants = await db.scalar(select(func.count(Tenant.id)).where(Tenant.status == "suspended")) or 0
    total_users = await db.scalar(select(func.count(User.id))) or 0
    total_orders = await db.scalar(select(func.count(Order.id))) or 0
    total_revenue = await db.scalar(select(func.coalesce(func.sum(Order.total_price), 0)).where(Order.status != "canceled")) or 0.0

    return PlatformStats(
        total_restaurants=total_restaurants,
        active_restaurants=active_restaurants,
        suspended_restaurants=suspended_restaurants,
        total_users=total_users,
        total_orders=total_orders,
        total_platform_revenue=float(total_revenue),
    )


@router.get("/restaurants/", response_model=List[TenantListItem])
async def list_restaurants(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all restaurants across the platform with aggregated stats."""
    tenants = (await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))).scalars().all()
    
    out = []
    for t in tenants:
        u_count = await db.scalar(select(func.count(User.id)).where(User.tenant_id == t.id)) or 0
        o_count = await db.scalar(select(func.count(Order.id)).where(Order.tenant_id == t.id)) or 0
        rev = await db.scalar(
            select(func.coalesce(func.sum(Order.total_price), 0))
            .where(Order.tenant_id == t.id, Order.status != "canceled")
        ) or 0.0

        out.append(TenantListItem(
            id=t.id,
            name=t.name,
            address=t.address,
            phone=t.phone,
            currency=t.currency or "so'm",
            status=t.status or "active",
            subscription_plan=t.subscription_plan or "pro",
            users_count=u_count,
            orders_count=o_count,
            total_revenue=float(rev),
            created_at=t.created_at,
        ))
    return out


@router.post("/restaurants/", status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    body: TenantCreateRequest,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Onboard a new restaurant and create its initial Restaurant Admin."""
    # Check if owner username already exists
    existing_user = await db.scalar(select(User.id).where(User.username == body.owner_username))
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu egasining username'i allaqachon mavjud")

    tenant = Tenant(
        name=body.name,
        address=body.address,
        phone=body.phone,
        currency=body.currency or "so'm",
        subscription_plan=body.subscription_plan or "pro",
        status="active",
    )
    db.add(tenant)
    await db.flush()

    owner = User(
        username=body.owner_username,
        full_name=body.owner_full_name,
        phone=body.owner_phone,
        hashed_password=hash_password(body.owner_password),
        role="admin",
        tenant_id=tenant.id,
    )
    db.add(owner)

    # Log audit
    audit = AuditLog(
        tenant_id=tenant.id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="tenant_created",
        resource_type="tenant",
        resource_id=tenant.id,
        details=f"Yangi restoran yaratildi: '{tenant.name}', Ega: {owner.username}",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(tenant)

    return {"message": "Restoran muvaffaqiyatli yaratildi", "restaurant_id": tenant.id, "owner_id": owner.id}


@router.put("/restaurants/{tenant_id}/status/")
async def toggle_restaurant_status(
    tenant_id: str,
    body: TenantUpdateRequest,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or suspend a restaurant."""
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Restoran topilmadi")

    old_status = tenant.status
    if body.status:
        tenant.status = body.status
    if body.subscription_plan:
        tenant.subscription_plan = body.subscription_plan
    if body.name:
        tenant.name = body.name
    if body.phone:
        tenant.phone = body.phone
    if body.address:
        tenant.address = body.address

    audit = AuditLog(
        tenant_id=tenant.id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="tenant_status_updated",
        resource_type="tenant",
        resource_id=tenant.id,
        details=f"Restoran holati o'zgartirildi: {old_status} -> {tenant.status}",
    )
    db.add(audit)
    await db.commit()

    return {"message": "Restoran ma'lumotlari yangilandi", "status": tenant.status}


@router.get("/audit-logs/", response_model=List[AuditLogItem])
async def list_audit_logs(
    limit: int = 50,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """View platform-wide security and activity audit logs."""
    logs = (
        await db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
    ).scalars().all()
    return logs
