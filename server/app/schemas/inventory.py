"""
Inventory schemas — Ingredient, Recipe, StockMovement.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Ingredient ─────────────────────────────────────────────
class IngredientCreate(BaseModel):
    name: str
    unit: str = "dona"
    stock_quantity: float = 0
    min_limit: float = 0
    cost_per_unit: float = 0


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    stock_quantity: Optional[float] = None
    min_limit: Optional[float] = None
    cost_per_unit: Optional[float] = None


class IngredientOut(BaseModel):
    id: str
    name: str
    unit: str
    stock_quantity: float
    min_limit: float
    cost_per_unit: float
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── RecipeLine ─────────────────────────────────────────────
class RecipeLineCreate(BaseModel):
    ingredient_id: str
    quantity_per_portion: float
    cost: float = 0


class RecipeLineOut(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: str
    unit: str
    quantity_per_portion: float
    cost: float

    class Config:
        from_attributes = True


class FoodRecipeOut(BaseModel):
    food_id: str
    food_name: str
    selling_price: float
    lines: List[RecipeLineOut]
    total_cost: float


class FoodRecipeCreate(BaseModel):
    food_id: str
    lines: List[RecipeLineCreate]


# ── StockMovement ──────────────────────────────────────────
class StockMovementCreate(BaseModel):
    ingredient_id: str
    movement_type: str = "kirim"  # kirim | sotuv | isrof | tuzatish
    quantity: float
    notes: Optional[str] = None


class StockMovementOut(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: str
    movement_type: str
    quantity: float
    unit: str
    operator_name: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
