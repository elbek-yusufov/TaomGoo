"""
Auth schemas — login, register, token responses.
"""
from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "cashier"
    tenant_id: Optional[str] = None


class TokenResponse(BaseModel):
    access: str
    refresh: str


class RefreshRequest(BaseModel):
    refresh: str


class TenantOut(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    currency: Optional[str] = "so'm"
    status: Optional[str] = "active"
    subscription_plan: Optional[str] = "pro"

    class Config:
        from_attributes = True


class UserProfileOut(BaseModel):
    user_id: str
    username: str
    full_name: str
    phone: Optional[str] = None
    role: str
    tenant: Optional[TenantOut] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    tokens: TokenResponse
    user: UserProfileOut
