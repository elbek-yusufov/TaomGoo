"""
Inventory models — Ingredient, RecipeLine, StockMovement.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(300), nullable=False)
    unit = Column(String(20), default="dona")  # kg | gramm | dona | litr
    stock_quantity = Column(Float, default=0)
    min_limit = Column(Float, default=0)
    cost_per_unit = Column(Float, default=0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="ingredients")
    recipe_lines = relationship("RecipeLine", back_populates="ingredient", lazy="selectin")
    stock_movements = relationship("StockMovement", back_populates="ingredient", lazy="selectin")

    def __repr__(self):
        return f"<Ingredient {self.name} — {self.stock_quantity} {self.unit}>"


class RecipeLine(Base):
    __tablename__ = "recipe_lines"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    food_id = Column(String, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    ingredient_name = Column(String(300), default="")
    unit = Column(String(20), default="dona")
    quantity_per_portion = Column(Float, default=0)
    cost = Column(Float, default=0)

    # Relationships
    food = relationship("Food", back_populates="recipe_lines")
    ingredient = relationship("Ingredient", back_populates="recipe_lines")

    def __repr__(self):
        return f"<RecipeLine {self.ingredient_name} → {self.food_id}>"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    ingredient_name = Column(String(300), default="")
    movement_type = Column(String(20), default="kirim")  # kirim | sotuv | isrof | tuzatish
    quantity = Column(Float, default=0)
    unit = Column(String(20), default="dona")
    operator_name = Column(String(200), default="")
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    ingredient = relationship("Ingredient", back_populates="stock_movements")

    def __repr__(self):
        return f"<StockMovement {self.movement_type} {self.quantity} {self.unit}>"
