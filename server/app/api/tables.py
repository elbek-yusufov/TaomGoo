"""
Tables API — CRUD and real-time floor plan management for POS, Waiter, and Admin.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_waiter_or_admin
from app.models.user import User
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate, TableOut

router = APIRouter(prefix="/tables", tags=["Tables"])


@router.get("/", response_model=List[TableOut])
async def list_tables(
    hall: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Table).where(Table.tenant_id == user.tenant_id)
    if hall:
        query = query.where(Table.hall == hall)
    query = query.order_by(Table.number)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TableOut, status_code=status.HTTP_201_CREATED)
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


async def _update_table_logic(table_id: str, body: TableUpdate, user: User, db: AsyncSession):
    result = await db.execute(
        select(Table).where(Table.id == table_id, Table.tenant_id == user.tenant_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Stol topilmadi")

    # If updating coordinates or layout, ensure admin
    updating_layout = body.x is not None or body.y is not None or body.number is not None or body.seats is not None
    if updating_layout and user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Stol joylashuvini faqat admin o'zgartira oladi")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(table, key, value)

    # Sync is_occupied with status
    if body.status:
        table.is_occupied = (body.status == "occupied")
    elif body.is_occupied is not None:
        table.status = "occupied" if body.is_occupied else "available"

    await db.commit()
    await db.refresh(table)
    return table


@router.put("/{table_id}/", response_model=TableOut)
async def update_table_put(
    table_id: str,
    body: TableUpdate,
    user: User = Depends(require_waiter_or_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_table_logic(table_id, body, user, db)


@router.patch("/{table_id}/", response_model=TableOut)
async def update_table_patch(
    table_id: str,
    body: TableUpdate,
    user: User = Depends(require_waiter_or_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_table_logic(table_id, body, user, db)


@router.post("/{table_id}/clean/", response_model=TableOut)
async def mark_table_cleaned(
    table_id: str,
    user: User = Depends(require_waiter_or_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark a dirty table as cleaned and available."""
    result = await db.execute(
        select(Table).where(Table.id == table_id, Table.tenant_id == user.tenant_id)
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Stol topilmadi")

    table.status = "available"
    table.is_occupied = False
    table.current_total = 0.0
    table.active_order_id = None
    table.occupied_since = None
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
