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
    role: str = "cashier"
    tenant_id: str


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
    currency: Optional[str] = "UZS"

    class Config:
        from_attributes = True


class UserProfileOut(BaseModel):
    user_id: str
    username: str
    full_name: str
    role: str
    tenant: TenantOut

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    tokens: TokenResponse
    user: UserProfileOut
