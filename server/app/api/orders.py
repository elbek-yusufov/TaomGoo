"""
Orders API — CRUD, status transitions, tenant-isolated WebSocket for KDS, and table integration.
"""
from typing import List, Dict, Optional
from datetime import datetime, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_cashier_or_admin, require_waiter_or_admin
from app.models.user import User
from app.models.menu import Food
from app.models.table import Table
from app.models.order import Order, OrderItem
from app.models.delivery import Delivery
from app.models.audit import AuditLog
from app.models.inventory import Ingredient, RecipeLine, StockMovement
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderOut, OrderItemOut

router = APIRouter(prefix="/orders", tags=["Orders"])


# ── Tenant-scoped WebSocket connections manager ──────────
class TenantScopedConnectionManager:
    def __init__(self):
        # Map: tenant_id -> list of active websockets
        self.active_rooms: Dict[str, List[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        self.active_rooms[tenant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self.active_rooms:
            if websocket in self.active_rooms[tenant_id]:
                self.active_rooms[tenant_id].remove(websocket)
            if not self.active_rooms[tenant_id]:
                del self.active_rooms[tenant_id]

    async def broadcast_to_tenant(self, tenant_id: str, data: dict):
        if tenant_id in self.active_rooms:
            for connection in list(self.active_rooms[tenant_id]):
                try:
                    await connection.send_json(data)
                except Exception:
                    pass


kitchen_ws = TenantScopedConnectionManager()


STATUS_LABELS = {
    "new": "Yangi",
    "cooking": "Tayyorlanmoqda",
    "ready": "Tayyor",
    "out_for_delivery": "Yo'lda",
    "delivered": "Berildi",
    "completed": "Yakunlandi",
    "canceled": "Bekor qilingan",
}


def _serialize_order(order: Order) -> dict:
    items = []
    for item in order.items:
        items.append({
            "id": item.id,
            "food": item.food_id,
            "food_name": item.food_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "line_total": item.line_total,
            "station": item.station,
        })
    return {
        "id": order.id,
        "order_number": order.order_number,
        "table": order.table_id,
        "table_number": order.table_number,
        "hall": order.hall,
        "table_or_phone": order.table_or_phone,
        "order_type": order.order_type,
        "waiter_name": order.waiter_name,
        "courier_name": order.courier_name,
        "status": order.status,
        "status_display": order.status_display,
        "payment_type": order.payment_type,
        "payment_status": order.payment_status,
        "service_fee_percent": order.service_fee_percent,
        "subtotal": order.subtotal,
        "service_fee_amount": order.service_fee_amount,
        "total_price": order.total_price,
        "items": items,
        "notes": order.notes,
        "delivery_address": order.delivery_address,
        "delivery_phone": order.delivery_phone,
        "delivery_notes": order.delivery_notes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


def _build_order_out(order: Order) -> OrderOut:
    items = [
        OrderItemOut(
            id=it.id,
            food=it.food_id,
            food_name=it.food_name,
            quantity=it.quantity,
            unit_price=it.unit_price,
            line_total=it.line_total,
            station=it.station,
        )
        for it in order.items
    ]
    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        table=order.table_id,
        table_number=order.table_number,
        hall=order.hall,
        table_or_phone=order.table_or_phone,
        order_type=order.order_type,
        waiter_name=order.waiter_name,
        courier_name=order.courier_name,
        status=order.status,
        status_display=order.status_display,
        payment_type=order.payment_type,
        payment_status=order.payment_status,
        service_fee_percent=order.service_fee_percent,
        subtotal=order.subtotal,
        service_fee_amount=order.service_fee_amount,
        total_price=order.total_price,
        items=items,
        notes=order.notes,
        delivery_address=order.delivery_address,
        delivery_phone=order.delivery_phone,
        delivery_notes=order.delivery_notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


# ── REST Endpoints ─────────────────────────────────────────
@router.get("/", response_model=List[OrderOut])
async def list_orders(
    status: Optional[str] = None,
    order_type: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.tenant_id == user.tenant_id)
    )
    if status:
        query = query.where(Order.status == status)
    if order_type:
        query = query.where(Order.order_type == order_type)
    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return [_build_order_out(o) for o in result.scalars().all()]


@router.get("/active/", response_model=List[OrderOut])
async def list_active_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all orders that are currently in-progress (not delivered, completed, or canceled)."""
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.tenant_id == user.tenant_id,
            Order.status.notin_(["delivered", "completed", "canceled"]),
        )
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(query)
    return [_build_order_out(o) for o in result.scalars().all()]


@router.get("/{order_id}/", response_model=OrderOut)
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.tenant_id == user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return _build_order_out(order)


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    user: User = Depends(require_waiter_or_admin),
    db: AsyncSession = Depends(get_db),
):
    # Calculate order number safely
    result = await db.execute(
        select(func.coalesce(func.max(Order.order_number), 100))
        .where(Order.tenant_id == user.tenant_id)
    )
    next_num = (result.scalar() or 100) + 1

    # Build order items and verify food items
    order_items = []
    subtotal = 0.0
    for item_in in body.items:
        food_result = await db.execute(
            select(Food).where(Food.id == item_in.food, Food.tenant_id == user.tenant_id)
        )
        food = food_result.scalar_one_or_none()
        if not food:
            raise HTTPException(status_code=404, detail=f"Taom topilmadi: {item_in.food}")

        unit_price = float(food.price)
        line_total = unit_price * item_in.quantity
        subtotal += line_total

        order_items.append(OrderItem(
            food_id=food.id,
            food_name=food.name,
            quantity=item_in.quantity,
            unit_price=unit_price,
            line_total=line_total,
            station=food.station,
        ))

    service_fee_amount = round(subtotal * (body.service_fee_percent or 0) / 100)
    total_price = subtotal + service_fee_amount

    # Resolve table info
    table_number = None
    hall = None
    if body.table:
        table_result = await db.execute(
            select(Table).where(Table.id == body.table, Table.tenant_id == user.tenant_id)
        )
        tbl = table_result.scalar_one_or_none()
        if tbl:
            table_number = tbl.number
            hall = tbl.hall
            tbl.is_occupied = True
            tbl.status = "occupied"
            tbl.current_total = total_price
            tbl.occupied_since = datetime.now(timezone.utc).isoformat()
            tbl.waiter_name = body.waiter_name or user.full_name

    order = Order(
        order_number=next_num,
        table_id=body.table,
        table_number=table_number,
        hall=hall,
        table_or_phone=body.table_or_phone,
        order_type=body.order_type,
        waiter_id=user.id if user.role == "waiter" else None,
        waiter_name=body.waiter_name or user.full_name,
        status="new",
        status_display="Yangi",
        payment_type=body.payment_type,
        payment_status="paid" if body.order_type != "dine_in" else "unpaid",
        service_fee_percent=body.service_fee_percent,
        subtotal=subtotal,
        service_fee_amount=service_fee_amount,
        total_price=total_price,
        notes=body.notes,
        delivery_address=body.delivery_address,
        delivery_phone=body.delivery_phone,
        delivery_notes=body.delivery_notes,
        tenant_id=user.tenant_id,
        items=order_items,
    )
    db.add(order)
    await db.flush()

    # Link table active_order_id
    if body.table and tbl:
        tbl.active_order_id = order.id

    # If delivery order, create delivery record
    if body.order_type == "delivery":
        delivery = Delivery(
            order_id=order.id,
            tenant_id=user.tenant_id,
            status="pending",
            customer_name=body.table_or_phone or "Yetkazib berish mijozi",
            phone=body.delivery_phone or body.table_or_phone,
            address=body.delivery_address or "Manzil ko'rsatilmagan",
            notes=body.delivery_notes or body.notes,
        )
        db.add(delivery)

    # Automatic recipe ingredient deduction
    for item in order_items:
        recipe_lines = (
            await db.execute(select(RecipeLine).where(RecipeLine.food_id == item.food_id))
        ).scalars().all()
        for rl in recipe_lines:
            ing = await db.get(Ingredient, rl.ingredient_id)
            if ing and ing.tenant_id == user.tenant_id:
                deduct_qty = rl.quantity_per_portion * item.quantity
                ing.stock_quantity = max(0.0, ing.stock_quantity - deduct_qty)
                ing.last_updated = datetime.now(timezone.utc)
                mv = StockMovement(
                    ingredient_id=ing.id,
                    ingredient_name=ing.name,
                    movement_type="sotuv",
                    quantity=deduct_qty,
                    unit=ing.unit,
                    operator_name=user.full_name,
                    notes=f"Buyurtma #{order.order_number} uchun sarflandi",
                )
                db.add(mv)

    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    # Broadcast to tenant's kitchen
    await kitchen_ws.broadcast_to_tenant(user.tenant_id, {
        "type": "new_order",
        "order": _serialize_order(order),
    })

    return _build_order_out(order)


@router.patch("/{order_id}/status/", response_model=OrderOut)
@router.put("/{order_id}/status/", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.tenant_id == user.tenant_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    old_status = order.status
    order.status = body.status
    order.status_display = STATUS_LABELS.get(body.status, body.status)
    order.updated_at = datetime.now(timezone.utc)

    # Handle Table state transitions
    if order.table_id:
        table_result = await db.execute(
            select(Table).where(Table.id == order.table_id, Table.tenant_id == user.tenant_id)
        )
        tbl = table_result.scalar_one_or_none()
        if tbl:
            if body.status in ("delivered", "completed"):
                # Mark as dirty for cleaning
                tbl.status = "dirty"
                tbl.is_occupied = False
                tbl.current_total = 0.0
                tbl.active_order_id = None
            elif body.status == "canceled":
                tbl.status = "available"
                tbl.is_occupied = False
                tbl.current_total = 0.0
                tbl.active_order_id = None

    # Handle Cancellation & Audit
    if body.status == "canceled":
        audit = AuditLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            user_name=user.full_name,
            action="order_canceled",
            resource_type="order",
            resource_id=order.id,
            details=f"Buyurtma #{order.order_number} bekor qilindi. Sabab: {body.cancel_reason or 'Sabab ko\'rsatilmadi'}",
        )
        db.add(audit)

    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    # Broadcast status change to kitchen & waiters in this tenant
    await kitchen_ws.broadcast_to_tenant(user.tenant_id, {
        "type": "order_status_changed",
        "order_id": order_id,
        "old_status": old_status,
        "new_status": body.status,
        "order": _serialize_order(order),
    })

    return _build_order_out(order)


# ── WebSocket for Kitchen & Waiter Live Updates (Tenant Scoped) ──
@router.websocket("/ws/kitchen/{tenant_id}")
async def kitchen_websocket_by_path(websocket: WebSocket, tenant_id: str):
    """Tenant-isolated WebSocket endpoint for kitchen KDS & floor plan."""
    await kitchen_ws.connect(websocket, tenant_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        kitchen_ws.disconnect(websocket, tenant_id)


@router.websocket("/ws/kitchen/")
async def kitchen_websocket_legacy(websocket: WebSocket, tenant_id: str = Query("tenant_demo")):
    """Fallback WebSocket connection endpoint."""
    await kitchen_ws.connect(websocket, tenant_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        kitchen_ws.disconnect(websocket, tenant_id)
