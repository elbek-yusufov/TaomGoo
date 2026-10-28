"""
Delivery model — yetkazib berish buyurtmalari va kuryer holatlari.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    courier_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    courier_name = Column(String(200), nullable=True)

    status = Column(String(30), default="pending", index=True)  # pending | accepted | out_for_delivery | delivered | failed
    customer_name = Column(String(200), default="Mijoz")
    phone = Column(String(50), nullable=False)
    address = Column(String(500), nullable=False)
    delivery_fee = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    failed_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="deliveries")
    order = relationship("Order", back_populates="delivery")
    courier = relationship("User", foreign_keys=[courier_id])

    def __repr__(self):
        return f"<Delivery #{self.order_id[:8]} ({self.status}) -> {self.customer_name}>"
