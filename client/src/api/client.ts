import { useStore } from '../store';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!skipAuth) {
      const token = useStore.getState().token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Always send Telegram initData if available (needed for login and session freshness)
    const tgInitData = (window as any).Telegram?.WebApp?.initData;
    if (tgInitData) {
      headers['X-Telegram-Init-Data'] = tgInitData;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'UNKNOWN', message: 'Request failed' }));
      throw new ApiError(response.status, error.error, error.message);
    }

    return response.json();
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  async login() {
    return this.request<{ token: string; user: any }>('/auth/telegram', {
      method: 'POST',
      skipAuth: true,
    });
  }

  async devLogin(role: 'ADMIN' | 'CUSTOMER' = 'ADMIN') {
    return this.request<{ token: string; user: any }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/me');
  }

  async updateProfile(data: Record<string, any>) {
    return this.request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  async getProducts(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/products${query}`);
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async searchProducts(query: string, params?: Record<string, string>) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request<any>(`/products/search?${searchParams}`);
  }

  // ─── Categories ────────────────────────────────────────────────────────────

  async getCategories() {
    return this.request<any>('/categories');
  }

  async getCategoryProducts(categoryId: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/categories/${categoryId}/products${query}`);
  }

  // ─── Basket ────────────────────────────────────────────────────────────────

  async getBasket() {
    return this.request<any>('/basket');
  }

  async addToBasket(productId: string, quantity: number = 1) {
    return this.request<any>('/basket', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateBasketItem(productId: string, quantity: number) {
    return this.request<any>(`/basket/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromBasket(productId: string) {
    return this.request<any>(`/basket/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearBasket() {
    return this.request<any>('/basket', {
      method: 'DELETE',
    });
  }

  // ─── Favorites ─────────────────────────────────────────────────────────────

  async getFavorites() {
    return this.request<{ favorites: any[]; count: number }>('/favorites');
  }

  async getFavoriteIds() {
    return this.request<string[]>('/favorites/ids');
  }

  async toggleFavorite(productId: string) {
    return this.request<{ favorited: boolean }>(`/favorites/${productId}`, {
      method: 'POST',
    });
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  async getOrders(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/orders${query}`);
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(deliveryInfo?: Record<string, any>, proofFile?: File | null) {
    if (proofFile) {
      const formData = new FormData();
      if (deliveryInfo) {
        Object.entries(deliveryInfo).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, String(v));
        });
      }
      formData.append('proof', proofFile);
      return this.request<any>('/orders', {
        method: 'POST',
        body: formData,
      });
    }

    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(deliveryInfo || {}),
    });
  }

  async uploadPaymentProof(orderId: string, file: File) {
    const formData = new FormData();
    formData.append('proof', file);
    return this.request<any>(`/orders/${orderId}/payment-proof`, {
      method: 'POST',
      body: formData,
    });
  }

  // ─── Bank Accounts ────────────────────────────────────────────────────────

  async getBankAccounts() {
    return this.request<any>('/bank-accounts');
  }

  // ─── News ──────────────────────────────────────────────────────────────────

  async getNews() {
    return this.request<any>('/news');
  }

  // ─── Banners ───────────────────────────────────────────────────────────────

  async getBanners() {
    return this.request<any>('/banners');
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async adminGetDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async adminGetProducts(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/admin/products${query}`);
  }

  async adminCreateProduct(data: FormData) {
    return this.request<any>('/admin/products', {
      method: 'POST',
      body: data,
    });
  }

  async adminUpdateProduct(id: string, data: FormData) {
    return this.request<any>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async adminGetCategories() {
    return this.request<any>('/admin/categories');
  }

  async adminCreateCategory(data: FormData) {
    return this.request<any>('/admin/categories', {
      method: 'POST',
      body: data,
    });
  }

  async adminUpdateCategory(id: string, data: FormData) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async adminGetUnits() {
    return this.request<any>('/admin/units');
  }

  async adminCreateUnit(data: Record<string, any>) {
    return this.request<any>('/admin/units', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateUnit(id: string, data: Record<string, any>) {
    return this.request<any>(`/admin/units/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async adminGetOrders(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/admin/orders${query}`);
  }

  async adminUpdateOrderStatus(orderId: string, status: string, note?: string) {
    return this.request<any>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async adminUpdatePaymentStatus(orderId: string, status: string) {
    return this.request<any>(`/admin/orders/${orderId}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async adminGetUsers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/admin/users${query}`);
  }

  async adminToggleUserBlock(userId: string) {
    return this.request<any>(`/admin/users/${userId}/toggle-block`, {
      method: 'PATCH',
    });
  }

  async adminGetBankAccounts() {
    return this.request<any>('/admin/bank-accounts');
  }

  async adminCreateBankAccount(data: Record<string, any>) {
    return this.request<any>('/admin/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateBankAccount(id: string, data: Record<string, any>) {
    return this.request<any>(`/admin/bank-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async adminGetNews() {
    return this.request<any>('/admin/news');
  }

  async adminCreateNews(data: FormData) {
    return this.request<any>('/admin/news', {
      method: 'POST',
      body: data,
    });
  }

  async adminUpdateNews(id: string, data: FormData) {
    return this.request<any>(`/admin/news/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async adminGetBanners() {
    return this.request<any>('/admin/banners');
  }

  async adminCreateBanner(data: FormData) {
    return this.request<any>('/admin/banners', {
      method: 'POST',
      body: data,
    });
  }

  async adminUpdateBanner(id: string, data: FormData) {
    return this.request<any>(`/admin/banners/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async adminDeleteProduct(id: string) {
    return this.request<any>(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  }

  async adminDeleteCategory(id: string) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async adminDeleteBankAccount(id: string) {
    return this.request<any>(`/admin/bank-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async adminDeleteBanner(id: string) {
    return this.request<any>(`/admin/banners/${id}`, {
      method: 'DELETE',
    });
  }

  async adminDeleteNews(id: string) {
    return this.request<any>(`/admin/news/${id}`, {
      method: 'DELETE',
    });
  }
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE);
