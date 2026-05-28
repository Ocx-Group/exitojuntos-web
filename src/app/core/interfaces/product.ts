export interface ProductCategory {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  state: boolean;
  offers: boolean;
  taxPercent: number;
  valuePoints: number;
  discountPercent: number;
  productCategoryId: number;
  category?: ProductCategory;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  description?: string;
  image?: string;
  state?: boolean;
  offers?: boolean;
  taxPercent?: number;
  valuePoints?: number;
  discountPercent?: number;
  productCategoryId: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}
