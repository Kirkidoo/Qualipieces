
import { OrchestraItem, OrchestraTokenResponse, AppConfig } from '../types';

export class OrchestraService {
  private accessToken: string | null = null;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async authenticate(): Promise<string> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.config.orchestraClientId);
    params.append('client_secret', this.config.orchestraClientSecret);

    const response = await fetch(this.config.orchestraIdentityUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data: OrchestraTokenResponse = await response.json();
    this.accessToken = data.access_token;
    return data.access_token;
  }

  async fetchItems(query: { filter?: string; pageNumber?: number; pageSize?: number } = {}): Promise<OrchestraItem[]> {
    if (!this.accessToken) await this.authenticate();

    const url = new URL(`${this.config.orchestraBaseUrl}/api/Items`);
    if (query.filter) url.searchParams.append('Filter', query.filter);
    if (query.pageNumber) url.searchParams.append('PageNumber', query.pageNumber.toString());
    if (query.pageSize) url.searchParams.append('PageSize', query.pageSize.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Retry once after re-auth
        await this.authenticate();
        return this.fetchItems(query);
      }
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return response.json();
  }
}
