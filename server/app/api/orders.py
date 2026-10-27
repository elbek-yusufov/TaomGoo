"""
Orders API — CRUD + status transitions + WebSocket for kitchen KDS.
"""
from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_cashier_or_admin, require_chef_or_admin
from app.models.user import User
from app.models.menu import Food
from app.models.table import Table
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderOut, OrderItemOut

router = APIRouter(prefix="/orders", tags=["Orders"])

# ── WebSocket connections manager ──────────────────────────
class KitchenConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass


kitchen_ws = KitchenConnectionManager()


STATUS_LABELS = {
    "new": "Yangi",
    "cooking": "Tayyorlanmoqda",
    "ready": "Tayyor",
    "delivered": "Berildi",
    "canceled": "Bekor qilingan",
}


def _serialize_order(order: Order) -> dict:
    """Convert order to JSON-serializable dict for WebSocket."""
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
        "status": order.status,
        "status_display": order.status_display,
        "payment_type": order.payment_type,
        "service_fee_percent": order.service_fee_percent,
        "subtotal": order.subtotal,
        "service_fee_amount": order.service_fee_amount,
        "total_price": order.total_price,
        "items": items,
        "notes": order.notes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


# ── REST Endpoints ─────────────────────────────────────────
@router.get("/", response_model=List[OrderOut])
async def list_orders(
    status: str | None = None,
    order_type: str | None = None,
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
    orders = result.scalars().all()

    out = []
    for o in orders:
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
            for it in o.items
        ]
        out.append(OrderOut(
            id=o.id,
            order_number=o.order_number,
            table=o.table_id,
            table_number=o.table_number,
            hall=o.hall,
            table_or_phone=o.table_or_phone,
            order_type=o.order_type,
            waiter_name=o.waiter_name,
            status=o.status,
            status_display=o.status_display,
            payment_type=o.payment_type,
            service_fee_percent=o.service_fee_percent,
            subtotal=o.subtotal,
            service_fee_amount=o.service_fee_amount,
            total_price=o.total_price,
            items=items,
            notes=o.notes,
            created_at=o.created_at,
            updated_at=o.updated_at,
        ))
    return out


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    # Get next order number
    result = await db.execute(
        select(func.coalesce(func.max(Order.order_number), 100))
        .where(Order.tenant_id == user.tenant_id)
    )
    next_num = result.scalar() + 1

    # Build order items
    order_items = []
    subtotal = 0
    for item_in in body.items:
        food_result = await db.execute(select(Food).where(Food.id == item_in.food))
        food = food_result.scalar_one_or_none()
        if not food:
            raise HTTPException(status_code=404, detail=f"Taom topilmadi: {item_in.food}")

        unit_price = food.price
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
            tbl.current_total = total_price
            tbl.occupied_since = datetime.now(timezone.utc).isoformat()
            tbl.active_order_id = None  # will be updated below

    order = Order(
        order_number=next_num,
        table_id=body.table,
        table_number=table_number,
        hall=hall,
        table_or_phone=body.table_or_phone,
        order_type=body.order_type,
        waiter_name=body.waiter_name or user.full_name,
        status="new",
        status_display="Yangi",
        payment_type=body.payment_type,
        service_fee_percent=body.service_fee_percent,
        subtotal=subtotal,
        service_fee_amount=service_fee_amount,
        total_price=total_price,
        notes=body.notes,
        tenant_id=user.tenant_id,
        items=order_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    # Update table with active_order_id
    if body.table:
        table_result = await db.execute(
            select(Table).where(Table.id == body.table)
        )
        tbl = table_result.scalar_one_or_none()
        if tbl:
            tbl.active_order_id = order.id
            await db.commit()

    # Broadcast to kitchen via WebSocket
    await kitchen_ws.broadcast({
        "type": "new_order",
        "order": _serialize_order(order),
    })

    items_out = [
        OrderItemOut(
            id=it.id, food=it.food_id, food_name=it.food_name,
            quantity=it.quantity, unit_price=it.unit_price,
            line_total=it.line_total, station=it.station,
        )
        for it in order.items
    ]
    return OrderOut(
        id=order.id, order_number=order.order_number,
        table=order.table_id, table_number=order.table_number, hall=order.hall,
        table_or_phone=order.table_or_phone, order_type=order.order_type,
        waiter_name=order.waiter_name, status=order.status,
        status_display=order.status_display, payment_type=order.payment_type,
        service_fee_percent=order.service_fee_percent, subtotal=order.subtotal,
        service_fee_amount=order.service_fee_amount, total_price=order.total_price,
        items=items_out, notes=order.notes,
        created_at=order.created_at, updated_at=order.updated_at,
    )


@router.patch("/{order_id}/status/", response_model=OrderOut)
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

    # Free table on delivery or cancellation
    if body.status in ("delivered", "canceled") and order.table_id:
        table_result = await db.execute(
            select(Table).where(Table.id == order.table_id)
        )
        tbl = table_result.scalar_one_or_none()
        if tbl:
            tbl.is_occupied = False
            tbl.current_total = 0
            tbl.active_order_id = None

    await db.commit()
    await db.refresh(order, attribute_names=["items"])

    # Broadcast status change
    await kitchen_ws.broadcast({
        "type": "order_status_changed",
        "order_id": order_id,
        "old_status": old_status,
        "new_status": body.status,
        "order": _serialize_order(order),
    })

    items_out = [
        OrderItemOut(
            id=it.id, food=it.food_id, food_name=it.food_name,
            quantity=it.quantity, unit_price=it.unit_price,
            line_total=it.line_total, station=it.station,
        )
        for it in order.items
    ]
    return OrderOut(
        id=order.id, order_number=order.order_number,
        table=order.table_id, table_number=order.table_number, hall=order.hall,
        table_or_phone=order.table_or_phone, order_type=order.order_type,
        waiter_name=order.waiter_name, status=order.status,
        status_display=order.status_display, payment_type=order.payment_type,
        service_fee_percent=order.service_fee_percent, subtotal=order.subtotal,
        service_fee_amount=order.service_fee_amount, total_price=order.total_price,
        items=items_out, notes=order.notes,
        created_at=order.created_at, updated_at=order.updated_at,
    )


# ── WebSocket for Kitchen KDS ─────────────────────────────
@router.websocket("/ws/kitchen/")
async def kitchen_websocket(websocket: WebSocket):
    """Real-time WebSocket endpoint for kitchen display system."""
    await kitchen_ws.connect(websocket)
    try:
        while True:
            # Keep connection alive, optionally receive pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        kitchen_ws.disconnect(websocket)
