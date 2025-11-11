// src/interfaces/cart.interface.ts
import mongoose from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ICart {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
  totalItems: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Add this interface for adding multiple items
export interface IAddToCartRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}
