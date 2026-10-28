"""
Central registry of all SQLAlchemy models for TaomGo.
Importing all models here ensures mapper registries and relationships resolve properly.
"""
from app.models.tenant import Tenant
from app.models.user import User
from app.models.menu import Category, Food
from app.models.table import Table
from app.models.order import Order, OrderItem
from app.models.inventory import Ingredient, RecipeLine, StockMovement
from app.models.cash_shift import CashShift
from app.models.audit import AuditLog
from app.models.delivery import Delivery

__all__ = [
    "Tenant",
    "User",
    "Category",
    "Food",
    "Table",
    "Order",
    "OrderItem",
    "Ingredient",
    "RecipeLine",
    "StockMovement",
    "CashShift",
    "AuditLog",
    "Delivery",
]
