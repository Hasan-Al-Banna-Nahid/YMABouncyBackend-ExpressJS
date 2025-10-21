// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import * as productService from "../services/product.service";
import { uploadToCloudinary } from "../utils/cloudinary.util";

export const createProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let imageCoverUrl;
    let imagesUrls: string[] = [];

    // Handle cover image
    if (req.files && (req.files as any).imageCover) {
      imageCoverUrl = await uploadToCloudinary(
        (req.files as any).imageCover[0]
      );
    }

    // Handle multiple images
    if (req.files && (req.files as any).images) {
      for (const file of (req.files as any).images) {
        const imageUrl = await uploadToCloudinary(file);
        imagesUrls.push(imageUrl);
      }
    }

    // Parse complex fields from JSON strings
    const specifications = req.body.specifications
      ? JSON.parse(req.body.specifications)
      : [];
    const safetyQuality = req.body.safetyQuality
      ? JSON.parse(req.body.safetyQuality)
      : [];
    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
    const colors = req.body.colors ? JSON.parse(req.body.colors) : [];
    const features = req.body.features ? JSON.parse(req.body.features) : {};

    // Parse request data
    const productData = {
      ...req.body,
      ...(imageCoverUrl && { imageCover: imageCoverUrl }),
      ...(imagesUrls.length > 0 && { images: imagesUrls }),
      categories: req.body.categories ? JSON.parse(req.body.categories) : [],
      location: req.body.location,
      availableFrom: new Date(req.body.availableFrom),
      availableUntil: new Date(req.body.availableUntil),
      price: parseFloat(req.body.price),
      priceDiscount: req.body.priceDiscount
        ? parseFloat(req.body.priceDiscount)
        : undefined,
      duration: parseInt(req.body.duration),
      maxGroupSize: parseInt(req.body.maxGroupSize),
      ratingsAverage: req.body.ratingsAverage
        ? parseFloat(req.body.ratingsAverage)
        : 4.5,
      ratingsQuantity: req.body.ratingsQuantity
        ? parseInt(req.body.ratingsQuantity)
        : 0,
      // New fields
      subtitle: req.body.subtitle,
      specifications,
      safetyQuality,
      sizes,
      colors,
      features,
      priceUnit: req.body.priceUnit || "per_day",
    };

    const product = await productService.createProduct(productData);

    res.status(201).json({
      status: "success",
      data: {
        product,
      },
    });
  }
);

// ... (keep your other existing controller functions)
export const getProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { products, total } = await productService.getAllProducts(req.query);

    res.status(200).json({
      status: "success",
      results: products.length,
      total,
      data: {
        products,
      },
    });
  }
);

export const getProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await productService.getProductById(req.params.id);

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let imageCoverUrl;
    let imagesUrls: string[] = [];

    if (req.files && (req.files as any).imageCover) {
      imageCoverUrl = await uploadToCloudinary(
        (req.files as any).imageCover[0]
      );
    }

    if (req.files && (req.files as any).images) {
      for (const file of (req.files as any).images) {
        const imageUrl = await uploadToCloudinary(file);
        imagesUrls.push(imageUrl);
      }
    }

    const updateData: any = {
      ...req.body,
      ...(imageCoverUrl && { imageCover: imageCoverUrl }),
    };

    // Parse specific fields if provided
    if (req.body.categories)
      updateData.categories = JSON.parse(req.body.categories);
    if (req.body.availableFrom)
      updateData.availableFrom = new Date(req.body.availableFrom);
    if (req.body.availableUntil)
      updateData.availableUntil = new Date(req.body.availableUntil);
    if (req.body.price) updateData.price = parseFloat(req.body.price);
    if (req.body.priceDiscount)
      updateData.priceDiscount = parseFloat(req.body.priceDiscount);
    if (req.body.duration) updateData.duration = parseInt(req.body.duration);
    if (req.body.maxGroupSize)
      updateData.maxGroupSize = parseInt(req.body.maxGroupSize);
    if (req.body.ratingsAverage)
      updateData.ratingsAverage = parseFloat(req.body.ratingsAverage);
    if (req.body.ratingsQuantity)
      updateData.ratingsQuantity = parseInt(req.body.ratingsQuantity);

    // Parse new fields
    if (req.body.specifications)
      updateData.specifications = JSON.parse(req.body.specifications);
    if (req.body.safetyQuality)
      updateData.safetyQuality = JSON.parse(req.body.safetyQuality);
    if (req.body.sizes) updateData.sizes = JSON.parse(req.body.sizes);
    if (req.body.colors) updateData.colors = JSON.parse(req.body.colors);
    if (req.body.features) updateData.features = JSON.parse(req.body.features);

    // If new images are uploaded, replace the existing ones
    if (imagesUrls.length > 0) {
      updateData.images = imagesUrls;
    }

    const product = await productService.updateProduct(
      req.params.id,
      updateData
    );

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    await productService.deleteProduct(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const getAvailableLocations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const locations = await productService.getAvailableLocations();

    res.status(200).json({
      status: "success",
      results: locations.length,
      data: {
        locations,
      },
    });
  }
);
