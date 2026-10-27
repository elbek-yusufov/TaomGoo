"""
Inventory API — Ingredients, Recipes, StockMovements.
"""
from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.menu import Food
from app.models.inventory import Ingredient, RecipeLine, StockMovement
from app.schemas.inventory import (
    IngredientCreate, IngredientUpdate, IngredientOut,
    FoodRecipeCreate, FoodRecipeOut, RecipeLineOut,
    StockMovementCreate, StockMovementOut,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ── Ingredients ────────────────────────────────────────────
@router.get("/ingredients/", response_model=List[IngredientOut])
async def list_ingredients(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient)
        .where(Ingredient.tenant_id == user.tenant_id)
        .order_by(Ingredient.name)
    )
    return result.scalars().all()


@router.post("/ingredients/", response_model=IngredientOut, status_code=201)
async def create_ingredient(
    body: IngredientCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    ing = Ingredient(**body.model_dump(), tenant_id=user.tenant_id)
    db.add(ing)
    await db.commit()
    await db.refresh(ing)
    return ing


@router.put("/ingredients/{ing_id}/", response_model=IngredientOut)
async def update_ingredient(
    ing_id: str,
    body: IngredientUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ing_id, Ingredient.tenant_id == user.tenant_id)
    )
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient topilmadi")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(ing, key, value)
    ing.last_updated = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ing)
    return ing


@router.delete("/ingredients/{ing_id}/", status_code=204)
async def delete_ingredient(
    ing_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ing_id, Ingredient.tenant_id == user.tenant_id)
    )
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient topilmadi")
    await db.delete(ing)
    await db.commit()


# ── Recipes ────────────────────────────────────────────────
@router.get("/recipes/{food_id}/", response_model=FoodRecipeOut)
async def get_recipe(
    food_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    food_result = await db.execute(
        select(Food).where(Food.id == food_id, Food.tenant_id == user.tenant_id)
    )
    food = food_result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Taom topilmadi")

    lines_result = await db.execute(
        select(RecipeLine).where(RecipeLine.food_id == food_id)
    )
    lines = lines_result.scalars().all()
    total_cost = sum(l.cost for l in lines)

    return FoodRecipeOut(
        food_id=food.id,
        food_name=food.name,
        selling_price=food.price,
        lines=[RecipeLineOut.model_validate(l) for l in lines],
        total_cost=total_cost,
    )


@router.post("/recipes/", response_model=FoodRecipeOut, status_code=201)
async def create_recipe(
    body: FoodRecipeCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    food_result = await db.execute(
        select(Food).where(Food.id == body.food_id, Food.tenant_id == user.tenant_id)
    )
    food = food_result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Taom topilmadi")

    # Delete old recipe lines
    old_lines = await db.execute(select(RecipeLine).where(RecipeLine.food_id == body.food_id))
    for old in old_lines.scalars().all():
        await db.delete(old)

    new_lines = []
    total_cost = 0
    for line_in in body.lines:
        ing_result = await db.execute(select(Ingredient).where(Ingredient.id == line_in.ingredient_id))
        ing = ing_result.scalar_one_or_none()
        if not ing:
            raise HTTPException(status_code=404, detail=f"Ingredient topilmadi: {line_in.ingredient_id}")

        cost = line_in.cost or (line_in.quantity_per_portion * ing.cost_per_unit)
        total_cost += cost

        rl = RecipeLine(
            food_id=body.food_id,
            ingredient_id=ing.id,
            ingredient_name=ing.name,
            unit=ing.unit,
            quantity_per_portion=line_in.quantity_per_portion,
            cost=cost,
        )
        db.add(rl)
        new_lines.append(rl)

    await db.commit()
    for rl in new_lines:
        await db.refresh(rl)

    return FoodRecipeOut(
        food_id=food.id,
        food_name=food.name,
        selling_price=food.price,
        lines=[RecipeLineOut.model_validate(l) for l in new_lines],
        total_cost=total_cost,
    )


# ── Stock Movements ───────────────────────────────────────
@router.get("/movements/", response_model=List[StockMovementOut])
async def list_movements(
    ingredient_id: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(StockMovement)
        .join(Ingredient, StockMovement.ingredient_id == Ingredient.id)
        .where(Ingredient.tenant_id == user.tenant_id)
    )
    if ingredient_id:
        query = query.where(StockMovement.ingredient_id == ingredient_id)
    query = query.order_by(StockMovement.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/movements/", response_model=StockMovementOut, status_code=201)
async def create_movement(
    body: StockMovementCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    ing_result = await db.execute(
        select(Ingredient).where(Ingredient.id == body.ingredient_id, Ingredient.tenant_id == user.tenant_id)
    )
    ing = ing_result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient topilmadi")

    # Update stock quantity
    if body.movement_type == "kirim":
        ing.stock_quantity += body.quantity
    elif body.movement_type in ("sotuv", "isrof"):
        ing.stock_quantity -= body.quantity
    elif body.movement_type == "tuzatish":
        ing.stock_quantity = body.quantity
    ing.last_updated = datetime.now(timezone.utc)

    movement = StockMovement(
        ingredient_id=ing.id,
        ingredient_name=ing.name,
        movement_type=body.movement_type,
        quantity=body.quantity,
        unit=ing.unit,
        operator_name=user.full_name,
        notes=body.notes,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(movement)
    return movement
