"""
Menu models — Category & Food (with station assignment).
"""
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0)
    icon = Column(String(100), nullable=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="categories")
    foods = relationship("Food", back_populates="category", lazy="selectin")

    def __repr__(self):
        return f"<Category {self.name}>"


class Food(Base):
    __tablename__ = "foods"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(300), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=True)
    is_available = Column(Boolean, default=True)
    image_url = Column(String(500), default="")
    station = Column(String(20), default="kitchen")  # kitchen | mangal | bar
    description = Column(String(1000), nullable=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="foods")
    tenant = relationship("Tenant", back_populates="foods")
    recipe_lines = relationship("RecipeLine", back_populates="food", lazy="selectin")

    def __repr__(self):
        return f"<Food {self.name} — {self.price}>"
