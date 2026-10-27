"""
User model — authentication and role-based access.
"""
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    hashed_password = Column(String(300), nullable=False)
    role = Column(String(20), nullable=False, default="cashier")  # admin | cashier | chef
    is_active = Column(Boolean, default=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
