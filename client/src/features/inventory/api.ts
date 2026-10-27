import { apiClient, USE_MOCK } from '../../lib/api-client';
import { Ingredient, FoodRecipe, StockMovement } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export async function getIngredientsApi(): Promise<Ingredient[]> {
  if (USE_MOCK) {
    return [...mockDb.ingredients];
  }
  return apiClient<Ingredient[]>('/api/v1/ingredients/');
}

export async function getLowStockIngredientsApi(): Promise<Ingredient[]> {
  if (USE_MOCK) {
    return mockDb.ingredients.filter((i) => i.stock_quantity <= i.min_limit);
  }
  return apiClient<Ingredient[]>('/api/v1/ingredients/low-stock/');
}

export async function stockInIngredientApi(id: string, quantity: number, notes?: string): Promise<Ingredient> {
  if (USE_MOCK) {
    const item = mockDb.ingredients.find((i) => i.id === id);
    if (!item) throw new Error('Masalliq topilmadi');
    item.stock_quantity += quantity;
    item.last_updated = new Date().toISOString().split('T')[0];

    mockDb.stockMovements.unshift({
      id: `mv_${Date.now()}`,
      ingredient_id: item.id,
      ingredient_name: item.name,
      movement_type: 'kirim',
      quantity,
      unit: item.unit,
      operator_name: 'Boshqaruvchi',
      notes: notes || 'Omborga qabul qilindi',
      created_at: new Date().toISOString(),
    });

    return item;
  }
  return apiClient<Ingredient>(`/api/v1/ingredients/${id}/stock-in/`, {
    method: 'POST',
    body: JSON.stringify({ quantity, notes }),
  });
}

export async function createIngredientApi(payload: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  if (USE_MOCK) {
    const newIng: Ingredient = {
      ...payload,
      id: `ing_${Date.now()}`,
      last_updated: new Date().toISOString().split('T')[0],
    };
    mockDb.ingredients.push(newIng);
    return newIng;
  }
  return apiClient<Ingredient>('/api/v1/ingredients/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIngredientApi(id: string, payload: Partial<Ingredient>): Promise<Ingredient> {
  if (USE_MOCK) {
    const idx = mockDb.ingredients.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Masalliq topilmadi');
    mockDb.ingredients[idx] = { ...mockDb.ingredients[idx], ...payload };
    return mockDb.ingredients[idx];
  }
  return apiClient<Ingredient>(`/api/v1/ingredients/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getRecipesApi(): Promise<FoodRecipe[]> {
  if (USE_MOCK) {
    return [...mockDb.recipes];
  }
  return apiClient<FoodRecipe[]>('/api/v1/recipes/');
}

export async function saveRecipeApi(recipe: FoodRecipe): Promise<FoodRecipe> {
  if (USE_MOCK) {
    const idx = mockDb.recipes.findIndex((r) => r.food_id === recipe.food_id);
    if (idx >= 0) {
      mockDb.recipes[idx] = recipe;
    } else {
      mockDb.recipes.push(recipe);
    }
    return recipe;
  }
  return apiClient<FoodRecipe>('/api/v1/recipes/', {
    method: 'POST',
    body: JSON.stringify(recipe),
  });
}

export async function getStockMovementsApi(): Promise<StockMovement[]> {
  if (USE_MOCK) {
    return [...mockDb.stockMovements];
  }
  return apiClient<StockMovement[]>('/api/v1/stock-movements/');
}
