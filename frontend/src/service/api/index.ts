import { authApi } from './authApi';
import { creditsApi } from './creditsApi';
import { mockupsApi } from './mockupsApi';
import { productsApi } from './productsApi';
import { subscriptionsApi } from './subscriptionsApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5371/api/v1'

// Initialize all APIs with token from localStorage
const token = localStorage.getItem("access_token");
if (token) {
  authApi.setToken(token);
  creditsApi.setToken(token);
  mockupsApi.setToken(token);
  productsApi.setToken(token);
  subscriptionsApi.setToken(token);
}

// Export individual API instances
export { authApi, creditsApi, mockupsApi, productsApi, subscriptionsApi };

// Legacy compatibility - Export wrapper objects with the old interface
export const legacyAuthApi = {
  login: (email: string, password: string) =>
    authApi.login({ email, password }),
  protected: () => 
    authApi.getCurrentUser(),
  register: (email: string, password: string, first_name?: string, last_name?: string) =>
    authApi.register({ email, password, first_name, last_name }),
  forgotPassword: (email: string) => {
    // This endpoint might not be available in the new API, keeping for compatibility
    return fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(res => res.json());
  },
  resetPassword: (token: string, password: string) => {
    // This endpoint might not be available in the new API, keeping for compatibility
    return fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    }).then(res => res.json());
  },
  verifyToken: () =>
    authApi.getCurrentUser(),
}

// Update token when it changes
export const updateApiToken = (token: string) => {
  authApi.setToken(token);
  creditsApi.setToken(token);
  mockupsApi.setToken(token);
  productsApi.setToken(token);
  subscriptionsApi.setToken(token);
};

// Export default (maintaining compatibility)
export default { authApi, creditsApi, mockupsApi, productsApi, subscriptionsApi };
