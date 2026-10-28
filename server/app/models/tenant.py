"""
Tenant model — multi-tenant support for restaurants.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    currency = Column(String(10), default="so'm")
    status = Column(String(20), default="active", nullable=False)  # active | suspended
    subscription_plan = Column(String(50), default="pro")         # basic | pro | enterprise
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    foods = relationship("Food", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    tables = relationship("Table", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    ingredients = relationship("Ingredient", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    cash_shifts = relationship("CashShift", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="tenant", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant {self.name} ({self.status})>"
