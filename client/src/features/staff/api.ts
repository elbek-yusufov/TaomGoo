import { apiClient, USE_MOCK } from '../../lib/api-client';
import { Role } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export interface StaffMember {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  phone: string;
  status: string;
}

export async function getStaffListApi(): Promise<StaffMember[]> {
  if (USE_MOCK) {
    return [...mockDb.staff];
  }
  return apiClient<StaffMember[]>('/api/v1/staff/');
}

export async function createStaffApi(payload: Omit<StaffMember, 'id'>): Promise<StaffMember> {
  if (USE_MOCK) {
    const newMember: StaffMember = {
      ...payload,
      id: `stf_${Date.now()}`,
    };
    mockDb.staff.push(newMember);
    return newMember;
  }
  return apiClient<StaffMember>('/api/v1/staff/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStaffApi(id: string, payload: Partial<StaffMember>): Promise<StaffMember> {
  if (USE_MOCK) {
    const idx = mockDb.staff.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Xodim topilmadi');
    mockDb.staff[idx] = { ...mockDb.staff[idx], ...payload };
    return mockDb.staff[idx];
  }
  return apiClient<StaffMember>(`/api/v1/staff/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteStaffApi(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    mockDb.staff = mockDb.staff.filter((s) => s.id !== id);
    return { success: true };
  }
  return apiClient(`/api/v1/staff/${id}/`, {
    method: 'DELETE',
  });
}
