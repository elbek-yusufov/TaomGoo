import { apiClient, USE_MOCK } from '../../lib/api-client';
import { AuthTokens, UserProfile } from '../../types';
import { MOCK_USERS } from '../../lib/mock/data';

export async function loginApi(username: string, password: string): Promise<{ tokens: AuthTokens; profile: UserProfile }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const userItem = MOCK_USERS[username.toLowerCase().trim()];
    if (userItem && userItem.passwordHash === password) {
      return {
        tokens: {
          access: `mock_jwt_access_${userItem.user.role}`,
          refresh: `mock_jwt_refresh_${userItem.user.role}`,
        },
        profile: userItem.user,
      };
    }
    throw new Error("Noto'g'ri login yoki parol kiritildi");
  }

  const tokens = await apiClient<AuthTokens>('/api/v1/auth/token/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const profile = await apiClient<UserProfile>('/api/v1/profile/', {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });

  return { tokens, profile };
}

export async function getProfileApi(): Promise<UserProfile> {
  if (USE_MOCK) {
    return MOCK_USERS.admin.user;
  }
  return apiClient<UserProfile>('/api/v1/profile/');
}
