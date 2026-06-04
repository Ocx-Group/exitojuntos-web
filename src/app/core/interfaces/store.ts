import { Product } from './product';

export type StoreStatus = 'active' | 'paused';

export interface Store {
  id: number;
  ownerUserId: number;
  publicToken: string;
  name?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  externalUrl?: string | null;
  externalLabel?: string | null;
  theme?: Record<string, unknown> | null;
  status: StoreStatus;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Producto del catálogo visto desde una tienda (destacados primero). */
export interface StoreCatalogItem extends Product {
  featured: boolean;
  customPitch: string | null;
  externalEnabled: boolean;
}

/** Entrada de producto destacado, tal como la administra el dueño. */
export interface StoreFeaturedProduct {
  id: number;
  storeId: number;
  productId: number;
  featured: boolean;
  sortOrder: number;
  customPitch: string | null;
  externalEnabled: boolean;
  product?: Product;
}

export interface UpdateStorePayload {
  name?: string;
  tagline?: string;
  logoUrl?: string;
  bannerUrl?: string;
  externalUrl?: string;
  externalLabel?: string;
  theme?: Record<string, unknown>;
  status?: StoreStatus;
}

export interface FeatureProductPayload {
  productId: number;
  sortOrder?: number;
  customPitch?: string;
}
