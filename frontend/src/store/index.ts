import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'editor' | 'admin';
  avatar?: string;
  preferences?: {
    categories: string[];
    sources: string[];
    language: string;
    darkMode: boolean;
    emailDigest: 'daily' | 'weekly' | 'never';
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('access_token', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ─── UI Store ──────────────────────────────────────────────────────────────────
interface UiState {
  sidebarOpen: boolean;
  aiChatOpen: boolean;
  searchOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setAiChatOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  aiChatOpen: false,
  searchOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAiChatOpen: (open) => set({ aiChatOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
