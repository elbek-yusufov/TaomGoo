"""
Order & OrderItem models — core business logic.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(Integer, nullable=False)
    table_id = Column(String, ForeignKey("tables.id"), nullable=True)
    table_number = Column(Integer, nullable=True)
    hall = Column(String(100), nullable=True)
    table_or_phone = Column(String(200), default="")
    order_type = Column(String(20), default="dine_in")  # dine_in | takeaway
    waiter_name = Column(String(200), default="Ofitsiant")
    status = Column(String(20), default="new")  # new | cooking | ready | delivered | canceled
    status_display = Column(String(50), default="Yangi")
    payment_type = Column(String(20), default="cash")  # cash | card | debt
    service_fee_percent = Column(Float, default=0)
    subtotal = Column(Float, default=0)
    service_fee_amount = Column(Float, default=0)
    total_price = Column(Float, default=0)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order #{self.order_number} — {self.status}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(String, ForeignKey("foods.id"), nullable=False)
    food_name = Column(String(300), default="")
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0)
    line_total = Column(Float, default=0)
    station = Column(String(20), default="kitchen")

    # Relationships
    order = relationship("Order", back_populates="items")

    def __repr__(self):
        return f"<OrderItem {self.food_name} x{self.quantity}>"
