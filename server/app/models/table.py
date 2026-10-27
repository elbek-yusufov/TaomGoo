"""
Table (Stol) model — floor plan management.
"""
import uuid
from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Table(Base):
    __tablename__ = "tables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    number = Column(Integer, nullable=False)
    hall = Column(String(100), default="Asosiy zal")
    seats = Column(Integer, default=4)
    is_occupied = Column(Boolean, default=False)
    current_total = Column(Float, default=0)
    active_order_id = Column(String, nullable=True)
    occupied_since = Column(String, nullable=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="tables")

    def __repr__(self):
        return f"<Table #{self.number} ({self.hall})>"
