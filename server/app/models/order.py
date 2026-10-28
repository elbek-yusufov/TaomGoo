"""
Order & OrderItem models — core business logic for POS, Kitchen, Waiter, and Delivery.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(Integer, nullable=False, index=True)
    table_id = Column(String, ForeignKey("tables.id", ondelete="SET NULL"), nullable=True)
    table_number = Column(Integer, nullable=True)
    hall = Column(String(100), nullable=True)
    table_or_phone = Column(String(200), default="")
    order_type = Column(String(30), default="dine_in")  # dine_in | takeaway | delivery
    
    waiter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    waiter_name = Column(String(200), default="Ofitsiant")

    courier_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    courier_name = Column(String(200), nullable=True)
    delivery_address = Column(String(500), nullable=True)
    delivery_phone = Column(String(50), nullable=True)
    delivery_notes = Column(String(500), nullable=True)

    status = Column(String(30), default="new", index=True)  # new | cooking | ready | out_for_delivery | delivered | completed | canceled
    status_display = Column(String(50), default="Yangi")
    
    payment_type = Column(String(20), default="cash")  # cash | card | debt
    payment_status = Column(String(30), default="unpaid")  # unpaid | paid | refunded
    shift_id = Column(String, ForeignKey("cash_shifts.id", ondelete="SET NULL"), nullable=True)

    service_fee_percent = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    service_fee_amount = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    notes = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="selectin", cascade="all, delete-orphan")
    cash_shift = relationship("CashShift", back_populates="orders")
    waiter = relationship("User", foreign_keys=[waiter_id])
    courier = relationship("User", foreign_keys=[courier_id])
    delivery = relationship("Delivery", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order #{self.order_number} — {self.status} ({self.total_price})>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(String, ForeignKey("foods.id", ondelete="RESTRICT"), nullable=False)
    food_name = Column(String(300), default="")
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)
    station = Column(String(30), default="kitchen")

    # Relationships
    order = relationship("Order", back_populates="items")
    food = relationship("Food", foreign_keys=[food_id])

    def __repr__(self):
        return f"<OrderItem {self.food_name} x{self.quantity}>"
