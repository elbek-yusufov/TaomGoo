"""
Menu schemas — Category & Food CRUD.
"""
from pydantic import BaseModel
from typing import Optional, List


# ── Category ───────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    icon: Optional[str] = None


class CategoryOut(BaseModel):
    id: str
    name: str
    sort_order: int
    icon: Optional[str] = None

    class Config:
        from_attributes = True


# ── Food ───────────────────────────────────────────────────
class FoodCreate(BaseModel):
    name: str
    category_id: str
    price: float
    cost_price: Optional[float] = None
    is_available: bool = True
    image_url: str = ""
    station: str = "kitchen"
    description: Optional[str] = None


class FoodUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    station: Optional[str] = None
    description: Optional[str] = None


class FoodOut(BaseModel):
    id: str
    name: str
    category_id: str
    category_name: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    is_available: bool
    image_url: str
    station: str
    description: Optional[str] = None

    class Config:
        from_attributes = True
