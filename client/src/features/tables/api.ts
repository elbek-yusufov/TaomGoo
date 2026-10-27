import { apiClient, USE_MOCK } from '../../lib/api-client';
import { Table } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export async function getTablesMapApi(): Promise<Table[]> {
  if (USE_MOCK) {
    return [...mockDb.tables];
  }
  return apiClient<Table[]>('/api/v1/tables/map/');
}

export async function createTableApi(payload: Omit<Table, 'id' | 'is_occupied' | 'current_total'>): Promise<Table> {
  if (USE_MOCK) {
    const newTable: Table = {
      ...payload,
      id: `tbl_${Date.now()}`,
      is_occupied: false,
      current_total: 0,
    };
    mockDb.tables.push(newTable);
    return newTable;
  }
  return apiClient<Table>('/api/v1/tables/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTableApi(id: string, payload: Partial<Table>): Promise<Table> {
  if (USE_MOCK) {
    const idx = mockDb.tables.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Stol topilmadi');
    mockDb.tables[idx] = { ...mockDb.tables[idx], ...payload };
    return mockDb.tables[idx];
  }
  return apiClient<Table>(`/api/v1/tables/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTableApi(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    mockDb.tables = mockDb.tables.filter((t) => t.id !== id);
    return { success: true };
  }
  return apiClient(`/api/v1/tables/${id}/`, {
    method: 'DELETE',
  });
}
