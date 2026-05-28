import { Product } from './product';

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Cart {
  id: number;
  userId: number;
  status: 'active' | 'abandoned' | 'converted';
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}
