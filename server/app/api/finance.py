"""
Finance / Dashboard API — aggregated statistics.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.inventory import Ingredient
from app.schemas.finance import (
    FinanceSummaryOut, RevenueByPayment, RevenueByHour,
    TopSellingItem, WaiterStat,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


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

    # Base query: orders for tenant on target date
    base_filter = [
        Order.tenant_id == user.tenant_id,
        Order.created_at >= start,
        Order.created_at < end,
    ]

    # Total orders & revenue
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
    total_canceled = int(row.total_canceled)

    # Revenue by payment type
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

    # Revenue by hour
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

    # Top selling items
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

    # Waiter stats
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

    # Low stock count
    low_stock = await db.execute(
        select(func.count(Ingredient.id))
        .where(Ingredient.tenant_id == user.tenant_id, Ingredient.stock_quantity <= Ingredient.min_limit)
    )
    low_stock_count = low_stock.scalar() or 0

    # Net profit estimate (revenue - cost would require COGS, for now = revenue * 0.65)
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
