"""
Finance & Cash Register API — Aggregated statistics, cash shifts (smena), and refunds.
"""
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_cashier_or_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.inventory import Ingredient
from app.models.cash_shift import CashShift
from app.models.audit import AuditLog
from app.schemas.finance import (
    FinanceSummaryOut, RevenueByPayment, RevenueByHour,
    TopSellingItem, WaiterStat,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


# Schemas for Shifts
class ShiftOpenRequest(BaseModel):
    initial_cash: float
    notes: Optional[str] = None


class ShiftCloseRequest(BaseModel):
    actual_cash: float
    notes: Optional[str] = None


class ShiftOut(BaseModel):
    id: str
    tenant_id: str
    cashier_id: str
    cashier_name: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    is_open: bool
    initial_cash: float
    total_cash_sales: float
    total_card_sales: float
    total_debt_sales: float
    expected_cash: float
    actual_cash: Optional[float] = None
    cash_difference: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class RefundRequest(BaseModel):
    order_id: str
    reason: str


# ── Cash Shifts (Smena) ──────────────────────────────────
@router.get("/shifts/current/", response_model=Optional[ShiftOut])
async def get_current_shift(
    user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get active open shift for the current cashier or restaurant."""
    query = select(CashShift).where(
        CashShift.tenant_id == user.tenant_id,
        CashShift.is_open == True,
    )
    if user.role == "cashier":
        query = query.where(CashShift.cashier_id == user.id)
    query = query.order_by(CashShift.opened_at.desc())
    
    result = await db.execute(query)
    shift = result.scalars().first()
    return shift


@router.post("/shifts/open/", response_model=ShiftOut, status_code=status.HTTP_201_CREATED)
async def open_shift(
    body: ShiftOpenRequest,
    user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Open a new cashier shift with starting drawer cash."""
    # Check if cashier already has an open shift
    existing = await db.execute(
        select(CashShift).where(
            CashShift.tenant_id == user.tenant_id,
            CashShift.cashier_id == user.id,
            CashShift.is_open == True,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Sizda allaqachon ochiq smena mavjud")

    shift = CashShift(
        tenant_id=user.tenant_id,
        cashier_id=user.id,
        cashier_name=user.full_name,
        initial_cash=body.initial_cash,
        expected_cash=body.initial_cash,
        notes=body.notes,
        is_open=True,
    )
    db.add(shift)

    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        user_name=user.full_name,
        action="shift_opened",
        resource_type="cash_shift",
        resource_id=shift.id,
        details=f"Smena ochildi. Boshlang'ich kassa: {body.initial_cash:,.0f} so'm",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(shift)
    return shift


@router.post("/shifts/close/", response_model=ShiftOut)
async def close_shift(
    body: ShiftCloseRequest,
    user: User = Depends(require_cashier_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Close active shift, calculate drawer difference and sales totals."""
    query = select(CashShift).where(
        CashShift.tenant_id == user.tenant_id,
        CashShift.is_open == True,
    )
    if user.role == "cashier":
        query = query.where(CashShift.cashier_id == user.id)
    query = query.order_by(CashShift.opened_at.desc())

    result = await db.execute(query)
    shift = result.scalars().first()
    if not shift:
        raise HTTPException(status_code=404, detail="Yopish uchun faol smena topilmadi")

    # Aggregate sales made during this shift
    sales_query = await db.execute(
        select(
            Order.payment_type,
            func.coalesce(func.sum(Order.total_price), 0).label("sum"),
        )
        .where(
            Order.tenant_id == user.tenant_id,
            Order.created_at >= shift.opened_at,
            Order.status != "canceled",
        )
        .group_by(Order.payment_type)
    )
    sales = {r.payment_type: float(r.sum) for r in sales_query.all()}
    shift.total_cash_sales = sales.get("cash", 0.0)
    shift.total_card_sales = sales.get("card", 0.0)
    shift.total_debt_sales = sales.get("debt", 0.0)

    shift.expected_cash = shift.initial_cash + shift.total_cash_sales
    shift.actual_cash = body.actual_cash
    shift.cash_difference = body.actual_cash - shift.expected_cash
    shift.is_open = False
    shift.closed_at = datetime.now(timezone.utc)
    if body.notes:
        shift.notes = f"{shift.notes or ''} | Yopilish izohi: {body.notes}".strip(" |")

    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        user_name=user.full_name,
        action="shift_closed",
        resource_type="cash_shift",
        resource_id=shift.id,
        details=f"Smena yopildi. Farq: {shift.cash_difference:,.0f} so'm. Naqd tushum: {shift.total_cash_sales:,.0f}",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(shift)
    return shift


@router.get("/shifts/", response_model=List[ShiftOut])
async def list_shifts(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List historical shifts for the restaurant."""
    result = await db.execute(
        select(CashShift)
        .where(CashShift.tenant_id == user.tenant_id)
        .order_by(CashShift.opened_at.desc())
        .limit(50)
    )
    return result.scalars().all()


# ── Refund Operation ──────────────────────────────────────
@router.post("/refund/")
async def refund_order(
    body: RefundRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Process an authorized refund for an order."""
    order = await db.get(Order, body.order_id)
    if not order or order.tenant_id != admin.tenant_id:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    if order.status == "canceled":
        raise HTTPException(status_code=400, detail="Buyurtma allaqachon bekor qilingan")

    order.payment_status = "refunded"
    order.status = "canceled"
    order.status_display = "Qaytarildi (Refund)"

    audit = AuditLog(
        tenant_id=admin.tenant_id,
        user_id=admin.id,
        user_name=admin.full_name,
        action="order_refunded",
        resource_type="order",
        resource_id=order.id,
        details=f"Buyurtma #{order.order_number} uchun refund qilindi ({order.total_price:,.0f} so'm). Sabab: {body.reason}",
    )
    db.add(audit)
    await db.commit()

    return {"message": "To'lov muvaffaqiyatli qaytarildi", "order_id": order.id, "refund_amount": order.total_price}


# ── Summary / Reports ─────────────────────────────────────
@router.get("/summary/", response_model=FinanceSummaryOut)
async def get_finance_summary(
    date: str | None = None,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get daily finance summary. Defaults to today if no date is provided."""
    if date:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    else:
        target_date = datetime.now(timezone.utc).date()

    start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end = start + timedelta(days=1)

    base_filter = [
        Order.tenant_id == user.tenant_id,
        Order.created_at >= start,
        Order.created_at < end,
    ]

    totals = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.total_price), 0).label("total_revenue"),
            func.sum(case((Order.status == "canceled", 1), else_=0)).label("total_canceled"),
        ).where(*base_filter)
    )
    row = totals.one()
    total_orders = row.total_orders
    total_revenue = float(row.total_revenue)
    total_canceled = int(row.total_canceled or 0)

    payment_result = await db.execute(
        select(
            Order.payment_type,
            func.coalesce(func.sum(Order.total_price), 0).label("amount"),
        )
        .where(*base_filter, Order.status != "canceled")
        .group_by(Order.payment_type)
    )
    payment_map = {"cash": 0.0, "card": 0.0, "debt": 0.0}
    for pr in payment_result.all():
        if pr.payment_type in payment_map:
            payment_map[pr.payment_type] = float(pr.amount)

    hour_result = await db.execute(
        select(
            func.extract("hour", Order.created_at).label("hour"),
            func.coalesce(func.sum(Order.total_price), 0).label("amount"),
        )
        .where(*base_filter, Order.status != "canceled")
        .group_by(func.extract("hour", Order.created_at))
        .order_by(func.extract("hour", Order.created_at))
    )
    revenue_by_hour = [
        RevenueByHour(hour=f"{int(h.hour):02d}:00", amount=float(h.amount))
        for h in hour_result.all()
    ]

    top_result = await db.execute(
        select(
            OrderItem.food_name,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.sum(OrderItem.line_total).label("total_amount"),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(*base_filter, Order.status != "canceled")
        .group_by(OrderItem.food_name)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(10)
    )
    top_selling = [
        TopSellingItem(food__name=t.food_name, total_qty=int(t.total_qty), total_amount=float(t.total_amount))
        for t in top_result.all()
    ]

    waiter_result = await db.execute(
        select(
            Order.waiter_name,
            func.count(Order.id).label("orders_count"),
            func.coalesce(func.sum(Order.total_price), 0).label("total_revenue"),
            func.coalesce(func.sum(Order.service_fee_amount), 0).label("service_fee"),
        )
        .where(*base_filter, Order.status != "canceled")
        .group_by(Order.waiter_name)
        .order_by(func.sum(Order.total_price).desc())
    )
    waiters = [
        WaiterStat(
            name=w.waiter_name,
            orders_count=w.orders_count,
            total_revenue=float(w.total_revenue),
            service_fee=float(w.service_fee),
        )
        for w in waiter_result.all()
    ]

    low_stock = await db.execute(
        select(func.count(Ingredient.id))
        .where(Ingredient.tenant_id == user.tenant_id, Ingredient.stock_quantity <= Ingredient.min_limit)
    )
    low_stock_count = low_stock.scalar() or 0

    net_profit = total_revenue * 0.65

    return FinanceSummaryOut(
        date=target_date.isoformat(),
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_canceled=total_canceled,
        net_profit=net_profit,
        low_stock_count=low_stock_count,
        revenue_by_payment=RevenueByPayment(**payment_map),
        revenue_by_hour=revenue_by_hour,
        top_selling_items=top_selling,
        waiters=waiters,
    )
