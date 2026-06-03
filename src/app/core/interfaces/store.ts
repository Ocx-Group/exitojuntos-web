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
}

/** Entrada de producto destacado, tal como la administra el dueño. */
export interface StoreFeaturedProduct {
  id: number;
  storeId: number;
  productId: number;
  featured: boolean;
  sortOrder: number;
  customPitch: string | null;
  product?: Product;
}

export interface UpdateStorePayload {
  name?: string;
  tagline?: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: Record<string, unknown>;
  status?: StoreStatus;
}

export interface FeatureProductPayload {
  productId: number;
  sortOrder?: number;
  customPitch?: string;
}
