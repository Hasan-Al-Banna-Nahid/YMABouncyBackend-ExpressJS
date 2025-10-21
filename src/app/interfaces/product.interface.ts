// src/interfaces/product.interface.ts
import mongoose from "mongoose";

export interface IProduct {
  name: string;
  subtitle?: string;
  description: string;
  specifications: {
    key: string;
    value: string;
  }[];
  safetyQuality: {
    key: string;
    value: string;
  }[];
  sizes: {
    name: string;
    dimensions: string;
    capacity?: string;
    weight?: string;
  }[];
  colors: {
    name: string;
    hexCode: string;
    description?: string;
  }[];
  features: {
    bouncer: boolean;
    versatility: boolean;
    indoor: boolean;
    outdoor: boolean;
    delivery: boolean;
    collection: boolean;
  };
  price: number;
  priceUnit: "per_day" | "per_week" | "per_month";
  priceDiscount?: number;
  images: string[];
  imageCover: string;
  categories: mongoose.Types.ObjectId[];
  ratingsAverage?: number;
  ratingsQuantity?: number;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  location: mongoose.Types.ObjectId;
  availableFrom: Date;
  availableUntil: Date;
  isActive?: boolean;
  createdAt?: Date;
}
