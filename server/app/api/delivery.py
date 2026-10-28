"""
Delivery API — courier deliveries management and status updates.
"""
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_courier_or_admin
from app.models.user import User
from app.models.order import Order
from app.models.delivery import Delivery
from app.models.audit import AuditLog

router = APIRouter(prefix="/delivery", tags=["Delivery"])


class DeliveryStatusUpdate(BaseModel):
    status: str  # accepted | out_for_delivery | delivered | failed
    notes: Optional[str] = None
    failed_reason: Optional[str] = None


class DeliveryOut(BaseModel):
    id: str
    order_id: str
    courier_id: Optional[str]
    courier_name: Optional[str]
    status: str
    customer_name: str
    phone: str
    address: str
    delivery_fee: float
    notes: Optional[str]
    failed_reason: Optional[str]
    created_at: datetime
    accepted_at: Optional[datetime]
    delivered_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DeliveryOut])
async def list_deliveries(
    status: Optional[str] = None,
    user: User = Depends(require_courier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """List deliveries for courier or restaurant."""
    query = (
        select(Delivery)
        .where(Delivery.tenant_id == user.tenant_id)
    )
    if status:
        query = query.where(Delivery.status == status)
    # If user is a courier, show unassigned pending deliveries OR deliveries assigned to this courier
    if user.role == "courier":
        query = query.where(
            (Delivery.courier_id == user.id) | (Delivery.courier_id == None)
        )
    query = query.order_by(Delivery.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{delivery_id}/accept/", response_model=DeliveryOut)
async def accept_delivery(
    delivery_id: str,
    user: User = Depends(require_courier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Assign delivery to current courier."""
    delivery = await db.get(Delivery, delivery_id)
    if not delivery or delivery.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Yetkazib berish buyurtmasi topilmadi")

    if delivery.courier_id and delivery.courier_id != user.id:
        raise HTTPException(status_code=400, detail="Ushbu buyurtma boshqa kuryerga biriktirilgan")

    delivery.courier_id = user.id
    delivery.courier_name = user.full_name
    delivery.status = "accepted"
    delivery.accepted_at = datetime.now(timezone.utc)

    # Update parent order
    order = await db.get(Order, delivery.order_id)
    if order:
        order.courier_id = user.id
        order.courier_name = user.full_name
        order.status = "cooking" if order.status == "new" else order.status
        order.status_display = "Kuryer qabul qildi"

    await db.commit()
    await db.refresh(delivery)
    return delivery


@router.patch("/{delivery_id}/status/", response_model=DeliveryOut)
async def update_delivery_status(
    delivery_id: str,
    body: DeliveryStatusUpdate,
    user: User = Depends(require_courier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update delivery status (out_for_delivery, delivered, failed)."""
    delivery = await db.get(Delivery, delivery_id)
    if not delivery or delivery.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Yetkazib berish buyurtmasi topilmadi")

    delivery.status = body.status
    if body.notes:
        delivery.notes = body.notes
    if body.failed_reason:
        delivery.failed_reason = body.failed_reason

    order = await db.get(Order, delivery.order_id)

    if body.status == "out_for_delivery":
        if order:
            order.status = "out_for_delivery"
            order.status_display = "Yo'lda (Kuryer)"
    elif body.status == "delivered":
        delivery.delivered_at = datetime.now(timezone.utc)
        if order:
            order.status = "delivered"
            order.status_display = "Yetkazildi"
            order.payment_status = "paid"
    elif body.status == "failed":
        if order:
            order.status_display = f"Yetkazib berilmadi: {body.failed_reason or ''}"
        audit = AuditLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            user_name=user.full_name,
            action="delivery_failed",
            resource_type="delivery",
            resource_id=delivery.id,
            details=f"Yetkazib berish muvaffaqiyatsiz bo'ldi. Sabab: {body.failed_reason}",
        )
        db.add(audit)

    await db.commit()
    await db.refresh(delivery)
    return delivery
