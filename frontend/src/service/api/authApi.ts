
import { BaseAPI } from './baseApi';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RefreshTokenRequest, RefreshTokenResponse, UserProfile, UserUpdate, UserChangePassword, CreditBalance } from '@/types';

export class AuthAPI extends BaseAPI {

  // ===========================================
  // AUTH ENDPOINTS
  // ===========================================

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.client.post('/auth/refresh', data);
    return response.data;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  // ===========================================
  // USER ENDPOINTS
  // ===========================================

  async updateProfile(data: UserUpdate): Promise<UserProfile> {
    const response = await this.client.put('/users/me', data);
    return response.data;
  }

  async changePassword(data: UserChangePassword): Promise<{ message: string }> {
    const response = await this.client.post('/users/me/change-password', data);
    return response.data;
  }

  async getCreditBalance(): Promise<CreditBalance> {
    const response = await this.client.get('/users/me/credits');
    return response.data;
  }
}

export const authApi = new AuthAPI();
