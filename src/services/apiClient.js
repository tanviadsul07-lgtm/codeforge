import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = {
  baseUrl: API_BASE_URL,

  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Automatically attach Firebase ID Token if user is authenticated
      try {
        const token = await authService.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        // Token lookup error handled gracefully
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return data;
    } catch (error) {
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, error.message);
      return { success: false, error: error.message || 'Network communication failure' };
    }
  }
};
