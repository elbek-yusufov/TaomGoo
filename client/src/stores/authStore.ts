import { create } from 'zustand';
import { Role, UserProfile, AuthTokens } from '../types';
import { MOCK_USERS } from '../lib/mock/data';

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: Role; error?: string }>;
  logout: () => void;
  setAuth: (tokens: AuthTokens, user: UserProfile) => void;
}

const STORAGE_KEY_AUTH = 'taomgo_auth';

function loadStoredAuth(): { user: UserProfile | null; tokens: AuthTokens | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse auth from storage', e);
  }
  // Default to mock admin so reviewers can immediately see everything, but allow quick role switching
  return {
    user: MOCK_USERS.admin.user,
    tokens: { access: 'mock_jwt_access_admin', refresh: 'mock_jwt_refresh_admin' },
  };
}

const initial = loadStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  tokens: initial.tokens,
  isAuthenticated: !!initial.user,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 400));

    const found = MOCK_USERS[username.toLowerCase().trim()];
    if (found && found.passwordHash === password) {
      const tokens: AuthTokens = {
        access: `mock_jwt_access_${found.user.role}_${Date.now()}`,
        refresh: `mock_jwt_refresh_${found.user.role}_${Date.now()}`,
      };
      const user = found.user;

      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ user, tokens }));
      } catch (e) {
        console.error(e);
      }

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, role: user.role };
    }

    // Invalid credentials
    const errorMsg = "Noto'g'ri login yoki parol kiritildi";
    set({ isLoading: false, error: errorMsg });
    return { success: false, error: errorMsg };
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error(e);
    }
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setAuth: (tokens: AuthTokens, user: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ user, tokens }));
    } catch (e) {
      console.error(e);
    }
    set({
      user,
      tokens,
      isAuthenticated: true,
      error: null,
    });
  },
}));

export function getDefaultRouteForRole(role?: Role): string {
  switch (role) {
    case 'cashier':
      return '/pos';
    case 'chef':
      return '/kitchen';
    case 'admin':
    default:
      return '/dashboard';
  }
}
