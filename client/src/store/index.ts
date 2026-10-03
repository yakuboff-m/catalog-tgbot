import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../i18n';

interface User {
  id: string;
  telegramId: string;
  telegramUsername?: string | null;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  fullName?: string | null;
  address?: string | null;
  buildingNumber?: string | null;
  homeNumber?: string | null;
  entranceCode?: string | null;
  language: string;
  theme: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface BasketItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    photo?: string | null;
    price: number;
    unitName: string;
    status: string;
    stockQuantity: number;
  };
}

type Theme = 'system' | 'light' | 'dark';

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Basket
  basketItems: BasketItem[];
  basketCount: number;
  basketMap: Record<string, number>;
  setBasketItems: (items: BasketItem[]) => void;
  updateBasketCount: (count: number) => void;
  setBasketCount: (count: number) => void;
  updateProductBasketQty: (productId: string, quantity: number) => void;

  // Favorites
  favoritesCount: number;
  favoriteIds: string[];
  setFavoritesCount: (count: number) => void;
  setFavoriteIds: (ids: string[]) => void;
  toggleFavoriteId: (id: string) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          language: (user.language as Language) || 'en',
          theme: (user.theme as Theme) || 'system',
        }),
      clearAuth: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          basketItems: [],
          basketCount: 0,
          basketMap: {},
          favoriteIds: [],
          favoritesCount: 0,
        }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Language
      language: 'en',
      setLanguage: (language) => set({ language }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Basket
      basketItems: [],
      basketCount: 0,
      basketMap: {},
      setBasketItems: (basketItems) => {
        const map: Record<string, number> = {};
        basketItems.forEach((i) => {
          map[i.productId] = i.quantity;
        });
        set({
          basketItems,
          basketMap: map,
          basketCount: basketItems.reduce((sum, item) => sum + item.quantity, 0),
        });
      },
      updateBasketCount: (basketCount) => set({ basketCount }),
      setBasketCount: (basketCount) => set({ basketCount }),
      updateProductBasketQty: (productId, quantity) =>
        set((state) => {
          const newMap = { ...state.basketMap };
          if (quantity <= 0) {
            delete newMap[productId];
          } else {
            newMap[productId] = quantity;
          }
          const totalCount = Object.values(newMap).reduce((sum, q) => sum + q, 0);
          return { basketMap: newMap, basketCount: totalCount };
        }),

      // Favorites
      favoritesCount: 0,
      favoriteIds: [],
      setFavoritesCount: (favoritesCount) => set({ favoritesCount }),
      setFavoriteIds: (favoriteIds) =>
        set({ favoriteIds, favoritesCount: favoriteIds.length }),
      toggleFavoriteId: (id) => {
        const state = get();
        const exists = state.favoriteIds.includes(id);
        const newIds = exists
          ? state.favoriteIds.filter((favId) => favId !== id)
          : [...state.favoriteIds, id];
        set({ favoriteIds: newIds, favoritesCount: newIds.length });
        return !exists;
      },
    }),
    {
      name: 'catalog-tgbot-store',
      partialize: (state) => ({
        token: state.token,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);
