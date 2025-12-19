
export interface OrchestraItem {
  id: number;
  itemNumber: string;
  itemType?: string;
  description: string;
  descriptionEN?: string;
  description2?: string;
  description2EN?: string;
  category?: string;
  subCategory?: string;
  active: boolean;
  photo?: string;
  pdf?: string;
  stock: number;
  retail: number;
  retailUS: number;
  weight: number;
  unitOfMeasure?: string;
  discontinued: boolean;
}

export interface OrchestraTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface AppConfig {
  orchestraClientId: string;
  orchestraClientSecret: string;
  orchestraBaseUrl: string;
  orchestraIdentityUrl: string;
  shopifyStoreUrl: string;
  shopifyAccessToken: string;
}

export enum SyncStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface SyncRecord {
  itemId: number;
  itemNumber: string;
  status: SyncStatus;
  message?: string;
  shopifyProductId?: string;
}
