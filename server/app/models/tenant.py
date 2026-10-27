"""
Tenant model — multi-tenant support for restaurants.
"""
import uuid
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    currency = Column(String(10), default="UZS")

    # Relationships
    users = relationship("User", back_populates="tenant", lazy="selectin")
    categories = relationship("Category", back_populates="tenant", lazy="selectin")
    foods = relationship("Food", back_populates="tenant", lazy="selectin")
    tables = relationship("Table", back_populates="tenant", lazy="selectin")
    orders = relationship("Order", back_populates="tenant", lazy="selectin")
    ingredients = relationship("Ingredient", back_populates="tenant", lazy="selectin")

    def __repr__(self):
        return f"<Tenant {self.name}>"
