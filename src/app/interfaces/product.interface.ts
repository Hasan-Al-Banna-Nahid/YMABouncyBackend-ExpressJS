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
    categories: mongoose.Schema.Types.ObjectId[];
    ratingsAverage?: number;
    ratingsQuantity?: number;
    duration: number;
    maxGroupSize: number;
    difficulty: 'easy' | 'medium' | 'difficult';
    isActive?: boolean;
    createdAt?: Date;
}