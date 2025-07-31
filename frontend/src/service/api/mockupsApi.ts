
import { BaseAPI } from './baseApi';
import { MockupCreate, MockupResponse, MockupTechniqueInfo, MockupGenerationStatus, MockupStatus } from '@/types';

export class MockupsAPI extends BaseAPI {

  // ===========================================
  // MOCKUP ENDPOINTS
  // ===========================================

  async getMarkingTechniques(): Promise<MockupTechniqueInfo[]> {
    const response = await this.client.get('/mockups/techniques');
    return response.data;
  }

  async uploadMockupImages(
    mockupId: string,
    image: File,
    type: string
  ): Promise<{
    image_url: string;
    type: string;
    mockupId: string
  }> {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('type', type);
    formData.append('mockup_id', mockupId);

    const response = await this.client.post('/mockups/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async createMockup(
    name: string,
    technique: string,
  ): Promise<MockupResponse> {
    const response = await this.client.post('/mockups', {
      name, technique
    });
    return response.data;
  }

  async getMockups(
    page = 1,
    per_page = 20,
    status?: MockupStatus
  ): Promise<{
    mockups: MockupResponse[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    if (status) params.append('status', status);

    const url = `/mockups?${params}`;
    console.log('Making request to:', url);
    console.log('Base URL:', this.client.defaults.baseURL);
    console.log('Has token:', !!this.getToken());

    const response = await this.client.get(url);
    return response.data;
  }
  
  async getMockup(mockupId: string): Promise<MockupResponse> {
    const response = await this.client.get(`/mockups/${mockupId}`);
    return response.data;
  }

  async getMockupStatus(mockupId: string): Promise<MockupGenerationStatus> {
    const response = await this.client.get(`/mockups/${mockupId}/status`);
    return response.data;
  }

  async updateMockup(
    mockupId: string,
    data: Partial<MockupCreate>
  ): Promise<MockupResponse> {
    const response = await this.client.put(`/mockups/${mockupId}`, data);
    return response.data;
  }

  async regenerateMockup(mockupId: string, data: Partial<MockupCreate>): Promise<MockupResponse> {
    const response = await this.client.post(`/mockups/${mockupId}/regenerate`, data);
    return response.data;
  }

  async deleteMockup(mockupId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/mockups/${mockupId}`);
    return response.data;
  }
}

export const mockupsApi = new MockupsAPI();
