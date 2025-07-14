
import { BaseAPI } from './baseApi';
import { CreditBalance, CreditPackage, CreditPurchase, CreditTransaction } from '@/types';

export class CreditsAPI extends BaseAPI {

  // ===========================================
  // CREDIT ENDPOINTS
  // ===========================================

  async getCreditPackages(): Promise<{ packages: CreditPackage[] }> {
    const response = await this.client.get('/credits/packages');
    return response.data;
  }

  async purchaseCredits(data: CreditPurchase): Promise<{
    payment_intent_id: string;
    client_secret: string;
    payment_id: string;
  }> {
    const response = await this.client.post('/credits/purchase', data);
    return response.data;
  }

  async getCreditHistory(page = 1, per_page = 20): Promise<{
    transactions: CreditTransaction[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const response = await this.client.get(`/credits/history?page=${page}&per_page=${per_page}`);
    return response.data;
  }

  async getCreditBalance(): Promise<CreditBalance> {
    const response = await this.client.get('/credits/balance');
    return response.data;
  }

  async getUserCredits(): Promise<any[]> {
    const response = await this.client.get('/credits');
    return response.data;
  }
}

export const creditsApi = new CreditsAPI();
