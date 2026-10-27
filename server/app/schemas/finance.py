"""
Finance / Dashboard schemas.
"""
from pydantic import BaseModel
from typing import List, Optional


class RevenueByHour(BaseModel):
    hour: str
    amount: float


class TopSellingItem(BaseModel):
    food__name: str
    total_qty: int
    total_amount: float


class WaiterStat(BaseModel):
    name: str
    orders_count: int
    total_revenue: float
    service_fee: float


class RevenueByPayment(BaseModel):
    cash: float
    card: float
    debt: float


class FinanceSummaryOut(BaseModel):
    date: str
    total_orders: int
    total_revenue: float
    total_canceled: int
    net_profit: float
    low_stock_count: int
    revenue_by_payment: RevenueByPayment
    revenue_by_hour: List[RevenueByHour]
    top_selling_items: List[TopSellingItem]
    waiters: List[WaiterStat]
    ai_summary: Optional[str] = None
