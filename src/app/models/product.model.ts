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
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle must have less or equal than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "A product must have a description"],
      trim: true,
    },
    specifications: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    safetyQuality: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    sizes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        dimensions: {
          type: String,
          required: true,
          trim: true,
        },
        capacity: {
          type: String,
          trim: true,
        },
        weight: {
          type: String,
          trim: true,
        },
      },
    ],
    colors: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        hexCode: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    features: {
      bouncer: {
        type: Boolean,
        default: false,
      },
      versatility: {
        type: Boolean,
        default: false,
      },
      indoor: {
        type: Boolean,
        default: false,
      },
      outdoor: {
        type: Boolean,
        default: false,
      },
      delivery: {
        type: Boolean,
        default: false,
      },
      collection: {
        type: Boolean,
        default: false,
      },
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
      min: [0, "Price must be above 0"],
    },
    priceUnit: {
      type: String,
      required: [true, "A product must have a price unit"],
      enum: {
        values: ["per_day", "per_week", "per_month"],
        message: "Price unit must be: per_day, per_week, or per_month",
      },
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
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "A product must have a location"],
    },
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ location: 1 });
productSchema.index({ availableFrom: 1, availableUntil: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ "features.bouncer": 1 });
productSchema.index({ "features.delivery": 1 });

// Virtual populate
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product",
  localField: "_id",
});

const Product = mongoose.model<IProductModel>("Product", productSchema);

export default Product;
