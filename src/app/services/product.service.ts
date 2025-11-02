// src/services/product.service.ts
import Product, { IProductModel } from "../models/product.model";
import Location from "../models/location.model";
import ApiError from "../utils/apiError";
import mongoose from "mongoose";

export const getAllProducts = async (
  query: any = {}
): Promise<{ products: IProductModel[]; total: number }> => {
  const {
    page = 1,
    limit = 10,
    category,
    location,
    minPrice,
    maxPrice,
    difficulty,
    sort = "-createdAt",
  } = query;

  let filterObj: any = { isActive: true };

  if (location) {
    if (mongoose.Types.ObjectId.isValid(location)) {
      filterObj.location = new mongoose.Types.ObjectId(location);
    } else {
      throw new ApiError("Invalid location ID format", 400);
    }
  }

  if (category) {
    filterObj.categories = Array.isArray(category)
      ? { $in: category }
      : category;
  }

  if (difficulty) {
    filterObj.difficulty = Array.isArray(difficulty)
      ? { $in: difficulty }
      : difficulty;
  }

  if (minPrice || maxPrice) {
    filterObj.price = {};
    if (minPrice) filterObj.price.$gte = Number(minPrice);
    if (maxPrice) filterObj.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  let sortObj: any = {};
  if (sort) {
    const sortFields = (sort as string).split(",");
    sortFields.forEach((field) => {
      const sortOrder = field.startsWith("-") ? -1 : 1;
      const fieldName = field.replace("-", "");
      sortObj[fieldName] = sortOrder;
    });
  } else {
    sortObj = { createdAt: -1 };
  }

  const products = await Product.find(filterObj)
    .populate("categories")
    .populate({
      path: "location",
      select:
        "name type country state city fullAddress coordinates description",
    })
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(filterObj);

  return { products, total };
};

export const getProductById = async (
  id: string
): Promise<IProductModel | null> => {
  const product = await Product.findById(id).populate("categories").populate({
    path: "location",
    select: "name type country state city fullAddress coordinates description",
  });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }
  return product;
};

export const createProduct = async (
  productData: Partial<IProductModel>
): Promise<IProductModel> => {
  // Validate location exists
  if (productData.location) {
    const location = await Location.findById(productData.location);
    if (!location) {
      throw new ApiError("Location not found", 404);
    }
  }

  // Validate dates
  if (productData.availableFrom && productData.availableUntil) {
    if (
      new Date(productData.availableUntil) <=
      new Date(productData.availableFrom)
    ) {
      throw new ApiError(
        "Available until date must be after available from date",
        400
      );
    }
  }

  const product = await Product.create(productData);

  // Populate the location before returning
  await product.populate({
    path: "location",
    select: "name type country state city fullAddress coordinates",
  });

  return product;
};

export const updateProduct = async (
  id: string,
  updateData: Partial<IProductModel>
): Promise<IProductModel | null> => {
  // Validate location if provided
  if (updateData.location) {
    const location = await Location.findById(updateData.location);
    if (!location) {
      throw new ApiError("Location not found", 404);
    }
  }

  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("categories")
    .populate({
      path: "location",
      select: "name type country state city fullAddress coordinates",
    });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }
  return product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!product) {
    throw new ApiError("Product not found", 404);
  }
};

// Helper function to get available locations for products
export const getAvailableLocations = async (): Promise<any[]> => {
  const locations = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "locations",
        localField: "location",
        foreignField: "_id",
        as: "locationData",
      },
    },
    { $unwind: "$locationData" },
    {
      $group: {
        _id: "$locationData._id",
        name: { $first: "$locationData.name" },
        type: { $first: "$locationData.type" },
        country: { $first: "$locationData.country" },
        state: { $first: "$locationData.state" },
        city: { $first: "$locationData.city" },
        productCount: { $sum: 1 },
      },
    },
    { $sort: { productCount: -1, name: 1 } },
  ]);

  return locations;
};

// New function to search products by location text
export const searchProductsByLocation = async (
  locationQuery: string,
  filters: any = {}
): Promise<{ products: IProductModel[]; total: number }> => {
  const aggregationPipeline: any[] = [
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "locations",
        localField: "location",
        foreignField: "_id",
        as: "locationData",
      },
    },
    { $unwind: "$locationData" },
    {
      $match: {
        $or: [
          { "locationData.country": { $regex: locationQuery, $options: "i" } },
          { "locationData.state": { $regex: locationQuery, $options: "i" } },
          { "locationData.city": { $regex: locationQuery, $options: "i" } },
          { "locationData.name": { $regex: locationQuery, $options: "i" } },
        ],
      },
    },
  ];

  // Add other filters
  if (filters.travelDate) {
    const targetDate = new Date(filters.travelDate);
    aggregationPipeline.push({
      $match: {
        availableFrom: { $lte: targetDate },
        availableUntil: { $gte: targetDate },
      },
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    const priceFilter: any = {};
    if (filters.minPrice) priceFilter.$gte = Number(filters.minPrice);
    if (filters.maxPrice) priceFilter.$lte = Number(filters.maxPrice);
    aggregationPipeline.push({ $match: { price: priceFilter } });
  }

  // Add pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  aggregationPipeline.push(
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "categories",
        foreignField: "_id",
        as: "categories",
      },
    }
  );

  const products = await Product.aggregate(aggregationPipeline);

  // Get total count
  const countPipeline = [...aggregationPipeline];
  countPipeline.splice(countPipeline.length - 3, 3); // Remove skip, limit, and lookup
  countPipeline.push({ $count: "total" });

  const countResult = await Product.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  return { products: products as IProductModel[], total };
};
