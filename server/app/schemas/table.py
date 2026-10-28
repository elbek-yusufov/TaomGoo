"""
Table schemas — CRUD, occupancy status, and floor plan.
"""
from pydantic import BaseModel
from typing import Optional


class TableCreate(BaseModel):
    number: int
    hall: str = "Asosiy zal"
    seats: int = 4
    status: Optional[str] = "available"
    x: Optional[float] = None
    y: Optional[float] = None


class TableUpdate(BaseModel):
    number: Optional[int] = None
    hall: Optional[str] = None
    seats: Optional[int] = None
    is_occupied: Optional[bool] = None
    status: Optional[str] = None  # available | occupied | dirty | reserved
    current_total: Optional[float] = None
    active_order_id: Optional[str] = None
    occupied_since: Optional[str] = None
    waiter_id: Optional[str] = None
    waiter_name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None


class TableOut(BaseModel):
    id: str
    number: int
    hall: str
    seats: int
    is_occupied: bool
    status: str = "available"
    current_total: Optional[float] = 0.0
    active_order_id: Optional[str] = None
    occupied_since: Optional[str] = None
    waiter_id: Optional[str] = None
    waiter_name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None

    class Config:
        from_attributes = True
