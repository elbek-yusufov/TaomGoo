import { apiClient, USE_MOCK } from '../../lib/api-client';
import { Order, OrderStatus, PaymentType } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export interface CreateOrderPayload {
  table?: string | null;
  table_or_phone: string;
  order_type: 'dine_in' | 'takeaway';
  waiter_name: string;
  payment_type: PaymentType;
  service_fee_percent: number;
  items: { food: string; quantity: number }[];
  notes?: string;
}

export async function getActiveOrdersApi(): Promise<Order[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return mockDb.orders.filter((o) => o.status !== 'delivered' && o.status !== 'canceled');
  }
  return apiClient<Order[]>('/api/v1/orders/active/');
}

export async function getAllOrdersApi(): Promise<Order[]> {
  if (USE_MOCK) {
    return [...mockDb.orders];
  }
  return apiClient<Order[]>('/api/v1/orders/');
}

export async function getOrderByIdApi(id: string): Promise<Order> {
  if (USE_MOCK) {
    const order = mockDb.orders.find((o) => o.id === id);
    if (!order) throw new Error('Buyurtma topilmadi');
    return order;
  }
  return apiClient<Order>(`/api/v1/orders/${id}/`);
}

export async function createOrderApi(payload: CreateOrderPayload): Promise<Order> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return mockDb.addOrder(payload);
  }
  return apiClient<Order>('/api/v1/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatusApi(id: string, status: OrderStatus): Promise<Order> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    return mockDb.updateOrderStatus(id, status);
  }
  return apiClient<Order>(`/api/v1/orders/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
