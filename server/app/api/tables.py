"""
Tables API — CRUD for floor plan management.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate, TableOut

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("/", response_model=List[TableOut])
async def list_tables(
    hall: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Table).where(Table.tenant_id == user.tenant_id)
    if hall:
        query = query.where(Table.hall == hall)
    query = query.order_by(Table.number)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TableOut, status_code=201)
async def create_table(
    body: TableCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    table = Table(**body.model_dump(), tenant_id=user.tenant_id)
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table


@router.put("/{table_id}/", response_model=TableOut)
async def update_table(
    table_id: str,
    body: TableUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Table).where(Table.id == table_id, Table.tenant_id == user.tenant_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Stol topilmadi")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(table, key, value)
    await db.commit()
    await db.refresh(table)
    return table


@router.delete("/{table_id}/", status_code=204)
async def delete_table(
    table_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Table).where(Table.id == table_id, Table.tenant_id == user.tenant_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Stol topilmadi")
    await db.delete(table)
    await db.commit()
