import { apiClient, USE_MOCK } from '../../lib/api-client';
import { FinanceSummary } from '../../types';
import { mockDb } from '../../lib/mock/mockState';

export async function getFinanceSummaryApi(from?: string, to?: string): Promise<FinanceSummary> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return { ...mockDb.financeSummary };
  }
  return apiClient<FinanceSummary>('/api/v1/finance/summary/', {
    params: { from, to },
  });
}

export async function getAnalyticsApi(date: string): Promise<FinanceSummary> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    return { ...mockDb.financeSummary, date };
  }
  return apiClient<FinanceSummary>('/api/v1/analytics/', {
    params: { date },
  });
}

export async function triggerAiAnalysisApi(date: string): Promise<{ status: string }> {
  if (USE_MOCK) {
    // Return 202 Accepted simulation
    await new Promise((r) => setTimeout(r, 400));
    return { status: 'processing' };
  }
  return apiClient<{ status: string }>('/api/v1/analytics/', {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
}
