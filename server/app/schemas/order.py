"""
Order schemas — create, update status, list, delivery, and payments.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemIn(BaseModel):
    food: str  # food_id
    quantity: int = 1


class OrderCreate(BaseModel):
    table: Optional[str] = None  # table_id
    table_or_phone: str = ""
    order_type: str = "dine_in"  # dine_in | takeaway | delivery
    waiter_name: Optional[str] = "Ofitsiant"
    payment_type: str = "cash"
    service_fee_percent: float = 0.0
    items: List[OrderItemIn]
    notes: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_phone: Optional[str] = None
    delivery_notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # new | cooking | ready | out_for_delivery | delivered | completed | canceled
    cancel_reason: Optional[str] = None


class OrderItemOut(BaseModel):
    id: Optional[str] = None
    food: str
    food_name: str
    quantity: int
    unit_price: float
    line_total: float
    station: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: str
    order_number: int
    table: Optional[str] = None
    table_number: Optional[int] = None
    hall: Optional[str] = None
    table_or_phone: str
    order_type: str
    waiter_name: str
    courier_name: Optional[str] = None
    status: str
    status_display: str
    payment_type: str
    payment_status: Optional[str] = "unpaid"
    service_fee_percent: float
    subtotal: float
    service_fee_amount: float
    total_price: float
    items: List[OrderItemOut]
    notes: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_phone: Optional[str] = None
    delivery_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
