import { apiClient, USE_MOCK } from '../../lib/api-client';
import { Category, Food } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export async function getCategoriesApi(): Promise<Category[]> {
  if (USE_MOCK) {
    return [...mockDb.categories];
  }
  return apiClient<Category[]>('/api/v1/categories/');
}

export async function getFoodsApi(): Promise<Food[]> {
  if (USE_MOCK) {
    return [...mockDb.foods];
  }
  return apiClient<Food[]>('/api/v1/menu/');
}

export async function getMenuByCategoryApi(): Promise<{ id: string; name: string; sort_order: number; foods: Food[] }[]> {
  if (USE_MOCK) {
    const categories = mockDb.categories.filter((c) => c.id !== 'cat_all');
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      sort_order: cat.sort_order,
      foods: mockDb.foods.filter((f) => f.category_id === cat.id),
    }));
  }
  return apiClient('/api/v1/menu/by-category/');
}

export async function createFoodApi(payload: Omit<Food, 'id'>): Promise<Food> {
  if (USE_MOCK) {
    const newFood: Food = {
      ...payload,
      id: `food_${Date.now()}`,
    };
    mockDb.foods.push(newFood);
    return newFood;
  }
  return apiClient<Food>('/api/v1/menu/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFoodApi(id: string, payload: Partial<Food>): Promise<Food> {
  if (USE_MOCK) {
    const idx = mockDb.foods.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Taom topilmadi');
    mockDb.foods[idx] = { ...mockDb.foods[idx], ...payload };
    return mockDb.foods[idx];
  }
  return apiClient<Food>(`/api/v1/menu/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteFoodApi(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    mockDb.foods = mockDb.foods.filter((f) => f.id !== id);
    return { success: true };
  }
  return apiClient(`/api/v1/menu/${id}/`, {
    method: 'DELETE',
  });
}

export async function createCategoryApi(name: string): Promise<Category> {
  if (USE_MOCK) {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name,
      sort_order: mockDb.categories.length,
    };
    mockDb.categories.push(newCat);
    return newCat;
  }
  return apiClient<Category>('/api/v1/categories/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateCategoryApi(id: string, name: string): Promise<Category> {
  if (USE_MOCK) {
    const cat = mockDb.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Kategoriya topilmadi');
    cat.name = name;
    return cat;
  }
  return apiClient<Category>(`/api/v1/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategoryApi(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    mockDb.categories = mockDb.categories.filter((c) => c.id !== id);
    return { success: true };
  }
  return apiClient(`/api/v1/categories/${id}/`, {
    method: 'DELETE',
  });
}
