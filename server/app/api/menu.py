"""
Menu API — Category & Food CRUD with full endpoint compatibility (PUT/PATCH, /menu and /categories).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.menu import Category, Food
from app.schemas.menu import (
    CategoryCreate, CategoryUpdate, CategoryOut,
    FoodCreate, FoodUpdate, FoodOut,
)

router = APIRouter(tags=["Menu"])


# ── Categories ─────────────────────────────────────────────
@router.get("/menu/categories/", response_model=List[CategoryOut])
@router.get("/categories/", response_model=List[CategoryOut])
async def list_categories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category)
        .where(Category.tenant_id == user.tenant_id)
        .order_by(Category.sort_order)
    )
    return result.scalars().all()


@router.post("/menu/categories/", response_model=CategoryOut, status_code=201)
@router.post("/categories/", response_model=CategoryOut, status_code=201)
async def create_category(
    body: CategoryCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = Category(**body.model_dump(), tenant_id=user.tenant_id)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def _update_cat(cat_id: str, body: CategoryUpdate, user: User, db: AsyncSession):
    result = await db.execute(
        select(Category).where(Category.id == cat_id, Category.tenant_id == user.tenant_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.put("/menu/categories/{cat_id}/", response_model=CategoryOut)
@router.put("/categories/{cat_id}/", response_model=CategoryOut)
async def update_category_put(
    cat_id: str,
    body: CategoryUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_cat(cat_id, body, user, db)


@router.patch("/menu/categories/{cat_id}/", response_model=CategoryOut)
@router.patch("/categories/{cat_id}/", response_model=CategoryOut)
async def update_category_patch(
    cat_id: str,
    body: CategoryUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_cat(cat_id, body, user, db)


@router.delete("/menu/categories/{cat_id}/", status_code=204)
@router.delete("/categories/{cat_id}/", status_code=204)
async def delete_category(
    cat_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == cat_id, Category.tenant_id == user.tenant_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    await db.delete(cat)
    await db.commit()


# ── Foods / Menu ──────────────────────────────────────────
@router.get("/menu/foods/", response_model=List[FoodOut])
@router.get("/menu/", response_model=List[FoodOut])
async def list_foods(
    category_id: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Food)
        .options(selectinload(Food.category))
        .where(Food.tenant_id == user.tenant_id)
    )
    if category_id:
        query = query.where(Food.category_id == category_id)
    query = query.order_by(Food.name)
    result = await db.execute(query)
    foods = result.scalars().all()

    out = []
    for f in foods:
        food_dict = FoodOut.model_validate(f).model_dump()
        if f.category:
            food_dict["category_name"] = f.category.name
        out.append(FoodOut(**food_dict))
    return out


@router.get("/menu/by-category/")
async def get_menu_by_category(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    categories = (
        await db.execute(
            select(Category)
            .where(Category.tenant_id == user.tenant_id)
            .order_by(Category.sort_order)
        )
    ).scalars().all()

    out = []
    for cat in categories:
        foods_res = await db.execute(
            select(Food).where(Food.category_id == cat.id, Food.tenant_id == user.tenant_id)
        )
        foods = foods_res.scalars().all()
        out.append({
            "id": cat.id,
            "name": cat.name,
            "sort_order": cat.sort_order,
            "foods": [FoodOut.model_validate(f).model_dump() for f in foods],
        })
    return out


@router.post("/menu/foods/", response_model=FoodOut, status_code=201)
@router.post("/menu/", response_model=FoodOut, status_code=201)
async def create_food(
    body: FoodCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    food = Food(**body.model_dump(), tenant_id=user.tenant_id)
    db.add(food)
    await db.commit()
    await db.refresh(food)
    return food


async def _update_food(food_id: str, body: FoodUpdate, user: User, db: AsyncSession):
    result = await db.execute(
        select(Food).where(Food.id == food_id, Food.tenant_id == user.tenant_id)
    )
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Taom topilmadi")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(food, key, value)
    await db.commit()
    await db.refresh(food)
    return food


@router.put("/menu/foods/{food_id}/", response_model=FoodOut)
@router.put("/menu/{food_id}/", response_model=FoodOut)
async def update_food_put(
    food_id: str,
    body: FoodUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_food(food_id, body, user, db)


@router.patch("/menu/foods/{food_id}/", response_model=FoodOut)
@router.patch("/menu/{food_id}/", response_model=FoodOut)
async def update_food_patch(
    food_id: str,
    body: FoodUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_food(food_id, body, user, db)


@router.delete("/menu/foods/{food_id}/", status_code=204)
@router.delete("/menu/{food_id}/", status_code=204)
async def delete_food(
    food_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Food).where(Food.id == food_id, Food.tenant_id == user.tenant_id)
    )
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Taom topilmadi")
    await db.delete(food)
    await db.commit()
