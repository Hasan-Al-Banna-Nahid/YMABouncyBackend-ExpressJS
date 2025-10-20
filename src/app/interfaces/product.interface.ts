// src/interfaces/product.interface.ts
import mongoose from "mongoose";

export interface IProduct {
  name: string;
  slug?: string;
  description: string;
  summary?: string;
  price: number;
  priceDiscount?: number;
  images: string[];
  imageCover: string;
  categories: mongoose.Types.ObjectId[];
  ratingsAverage?: number;
  ratingsQuantity?: number;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";

  // Updated location field - reference to Location model
  location: mongoose.Types.ObjectId;

  // Date fields for availability
  availableFrom: Date;
  availableUntil: Date;
  isActive?: boolean;
  createdAt?: Date;
}
