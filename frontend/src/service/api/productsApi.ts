
import { BaseAPI } from './baseApi';
import { ProductResponse, ProductCategory } from '@/types';

export class ProductsAPI extends BaseAPI {

  // ===========================================
  // PRODUCT ENDPOINTS
  // ===========================================

  async getProducts(
    page = 1,
    per_page = 20,
    category?: string,
    search?: string
  ): Promise<{
    products: ProductResponse[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const response = await this.client.get(`/products?${params}`);
    return response.data;
  }

  async getProductCategories(): Promise<{
    categories: ProductCategory[];
    total_products: number;
  }> {
    const response = await this.client.get('/products/categories');
    return response.data;
  }

  async getProduct(productId: string): Promise<ProductResponse> {
    const response = await this.client.get(`/products/${productId}`);
    return response.data;
  }
}

export const productsApi = new ProductsAPI();
