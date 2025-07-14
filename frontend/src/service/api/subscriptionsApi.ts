
import { BaseAPI } from './baseApi';
import { SubscriptionPlanInfo, SubscriptionUsage, SubscriptionResponse, SubscriptionPlan } from '@/types';

export class SubscriptionsAPI extends BaseAPI {

  // ===========================================
  // SUBSCRIPTION ENDPOINTS
  // ===========================================

  async getSubscriptionPlans(): Promise<{ plans: SubscriptionPlanInfo[] }> {
    const response = await this.client.get('/subscriptions/plans');
    return response.data;
  }

  async getCurrentSubscription(): Promise<SubscriptionUsage | null> {
    const response = await this.client.get('/subscriptions/current');
    return response.data;
  }

  async createSubscription(data: {
    plan: SubscriptionPlan;
    payment_method_id: string;
  }): Promise<SubscriptionResponse> {
    const response = await this.client.post('/subscriptions', data);
    return response.data;
  }

  async updateSubscription(data: {
    plan: SubscriptionPlan;
  }): Promise<SubscriptionResponse> {
    const response = await this.client.put('/subscriptions/current', data);
    return response.data;
  }

  async cancelSubscription(data: {
    reason?: string;
    feedback?: string;
  }): Promise<{
    message: string;
    cancellation_date: string;
    refund_amount?: number;
  }> {
    const response = await this.client.post('/subscriptions/cancel', data);
    return response.data;
  }

  async reactivateSubscription(): Promise<SubscriptionResponse> {
    const response = await this.client.post('/subscriptions/reactivate');
    return response.data;
  }

  // ===========================================
  // PAYMENT ENDPOINTS
  // ===========================================

  async createSetupIntent(): Promise<{ client_secret: string }> {
    const response = await this.client.post('/payments/setup-intent');
    return response.data;
  }

  async getPaymentMethods(): Promise<{ payment_methods: any[] }> {
    const response = await this.client.get('/payments/methods');
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/payments/methods/${paymentMethodId}`);
    return response.data;
  }

  async getPaymentHistory(): Promise<{ payments: any[] }> {
    const response = await this.client.get('/payments/history');
    return response.data;
  }
}

export const subscriptionsApi = new SubscriptionsAPI();
