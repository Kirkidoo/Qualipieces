
import { OrchestraItem, AppConfig } from '../types';

export class ShopifyService {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async createProduct(item: OrchestraItem): Promise<any> {
    const shopifyUrl = `https://${this.config.shopifyStoreUrl}/admin/api/2024-01/products.json`;
    
    const productPayload = {
      product: {
        title: item.descriptionEN || item.description || `Product ${item.itemNumber}`,
        body_html: item.description2EN || item.description2 || 'No description provided.',
        vendor: 'Orchestra Import',
        product_type: item.category || 'General',
        status: 'draft',
        variants: [
          {
            sku: item.itemNumber,
            price: item.retail.toString(),
            inventory_management: 'shopify',
            inventory_quantity: item.stock,
            weight: item.weight,
            weight_unit: 'kg'
          }
        ],
        images: item.photo ? [{ src: item.photo }] : []
      }
    };

    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.config.shopifyAccessToken,
      },
      body: JSON.stringify(productPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Shopify API error: ${JSON.stringify(errorData.errors)}`);
    }

    return response.json();
  }
}
