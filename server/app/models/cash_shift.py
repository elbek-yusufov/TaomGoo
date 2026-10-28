"""
CashShift model — POS smena boshqaruvi va kassa hisobdorligi.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class CashShift(Base):
    __tablename__ = "cash_shifts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    cashier_id = Column(String, ForeignKey("users.id"), nullable=False)
    cashier_name = Column(String(200), default="Kassir")
    
    opened_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    is_open = Column(Boolean, default=True, index=True)

    initial_cash = Column(Float, default=0.0)
    total_cash_sales = Column(Float, default=0.0)
    total_card_sales = Column(Float, default=0.0)
    total_debt_sales = Column(Float, default=0.0)
    expected_cash = Column(Float, default=0.0)
    actual_cash = Column(Float, nullable=True)
    cash_difference = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="cash_shifts")
    cashier = relationship("User", foreign_keys=[cashier_id])
    orders = relationship("Order", back_populates="cash_shift")

    def __repr__(self):
        status = "Ochiq" if self.is_open else "Yopiq"
        return f"<CashShift {self.id[:8]} ({status}) — {self.cashier_name}>"
