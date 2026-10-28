"""
Inventory API — Ingredients, Recipes, StockMovements with full alias and action support.
"""
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(tags=["Inventory"])


class StockInRequest(BaseModel):
    quantity: float
    notes: Optional[str] = "Omborga qabul qilindi"


# ── Ingredients ────────────────────────────────────────────
@router.get("/inventory/ingredients/", response_model=List[IngredientOut])
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


@router.get("/inventory/ingredients/low-stock/", response_model=List[IngredientOut])
@router.get("/ingredients/low-stock/", response_model=List[IngredientOut])
async def list_low_stock_ingredients(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient)
        .where(Ingredient.tenant_id == user.tenant_id, Ingredient.stock_quantity <= Ingredient.min_limit)
        .order_by(Ingredient.name)
    )
    return result.scalars().all()


@router.post("/inventory/ingredients/", response_model=IngredientOut, status_code=201)
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


@router.post("/inventory/ingredients/{ing_id}/stock-in/", response_model=IngredientOut)
@router.post("/ingredients/{ing_id}/stock-in/", response_model=IngredientOut)
async def stock_in_ingredient(
    ing_id: str,
    body: StockInRequest,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ing_id, Ingredient.tenant_id == user.tenant_id)
    )
    ing = result.scalar_one_or_none()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient topilmadi")

    ing.stock_quantity += body.quantity
    ing.last_updated = datetime.now(timezone.utc)

    # Record stock movement
    movement = StockMovement(
        ingredient_id=ing.id,
        ingredient_name=ing.name,
        movement_type="kirim",
        quantity=body.quantity,
        unit=ing.unit,
        operator_name=user.full_name,
        notes=body.notes,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(ing)
    return ing


async def _update_ingredient(ing_id: str, body: IngredientUpdate, user: User, db: AsyncSession):
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


@router.put("/inventory/ingredients/{ing_id}/", response_model=IngredientOut)
@router.put("/ingredients/{ing_id}/", response_model=IngredientOut)
async def update_ingredient_put(
    ing_id: str,
    body: IngredientUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_ingredient(ing_id, body, user, db)


@router.patch("/inventory/ingredients/{ing_id}/", response_model=IngredientOut)
@router.patch("/ingredients/{ing_id}/", response_model=IngredientOut)
async def update_ingredient_patch(
    ing_id: str,
    body: IngredientUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _update_ingredient(ing_id, body, user, db)


@router.delete("/inventory/ingredients/{ing_id}/", status_code=204)
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
@router.get("/inventory/recipes/{food_id}/", response_model=FoodRecipeOut)
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


@router.get("/inventory/recipes/", response_model=List[FoodRecipeOut])
@router.get("/recipes/", response_model=List[FoodRecipeOut])
async def list_recipes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    foods = (
        await db.execute(
            select(Food).where(Food.tenant_id == user.tenant_id)
        )
    ).scalars().all()

    out = []
    for food in foods:
        lines = (
            await db.execute(select(RecipeLine).where(RecipeLine.food_id == food.id))
        ).scalars().all()
        if lines:
            total_cost = sum(l.cost for l in lines)
            out.append(FoodRecipeOut(
                food_id=food.id,
                food_name=food.name,
                selling_price=food.price,
                lines=[RecipeLineOut.model_validate(l) for l in lines],
                total_cost=total_cost,
            ))
    return out


@router.post("/inventory/recipes/", response_model=FoodRecipeOut, status_code=201)
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
        ing_result = await db.execute(
            select(Ingredient).where(Ingredient.id == line_in.ingredient_id, Ingredient.tenant_id == user.tenant_id)
        )
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
@router.get("/inventory/movements/", response_model=List[StockMovementOut])
@router.get("/stock-movements/", response_model=List[StockMovementOut])
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


@router.post("/inventory/movements/", response_model=StockMovementOut, status_code=201)
@router.post("/stock-movements/", response_model=StockMovementOut, status_code=201)
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
        ing.stock_quantity = max(0.0, ing.stock_quantity - body.quantity)
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
