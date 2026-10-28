"""
Table (Stol) model — floor plan and table occupancy management.
"""
import uuid
from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Table(Base):
    __tablename__ = "tables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    number = Column(Integer, nullable=False, index=True)
    hall = Column(String(100), default="Asosiy zal", index=True)
    seats = Column(Integer, default=4)
    is_occupied = Column(Boolean, default=False)
    status = Column(String(30), default="available", nullable=False)  # available | occupied | dirty | reserved
    current_total = Column(Float, default=0.0)
    active_order_id = Column(String, nullable=True)
    occupied_since = Column(String, nullable=True)
    waiter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    waiter_name = Column(String(200), nullable=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="tables")
    waiter = relationship("User", foreign_keys=[waiter_id])

    def __repr__(self):
        return f"<Table #{self.number} ({self.hall}) — {self.status}>"
