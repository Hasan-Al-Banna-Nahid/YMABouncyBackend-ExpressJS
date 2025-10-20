// src/models/product.model.ts
import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "../interfaces/product.interface";

export interface IProductModel extends IProduct, Document {}

const productSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      trim: true,
      maxlength: [
        100,
        "A product name must have less or equal than 100 characters",
      ],
      minlength: [
        10,
        "A product name must have more or equal than 10 characters",
      ],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "A product must have a description"],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
      min: [0, "Price must be above 0"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: IProductModel, value: number) {
          return !value || value < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price",
      },
    },
    images: [String],
    imageCover: {
      type: String,
      required: [true, "A product must have a cover image"],
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, "A product must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A product must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A product must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    // Reference to Location model
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "A product must have a location"],
    },
    // Date availability
    availableFrom: {
      type: Date,
      required: [true, "A product must have an available from date"],
    },
    availableUntil: {
      type: Date,
      required: [true, "A product must have an available until date"],
      validate: {
        validator: function (this: IProductModel, value: Date) {
          return value > this.availableFrom;
        },
        message: "Available until date must be after available from date",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ location: 1 });
productSchema.index({ availableFrom: 1, availableUntil: 1 });
productSchema.index({ isActive: 1 });

// Virtual populate
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

const Product = mongoose.model<IProductModel>("Product", productSchema);

export default Product;
