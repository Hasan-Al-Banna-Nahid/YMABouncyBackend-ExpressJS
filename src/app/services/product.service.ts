// src/services/product.service.ts
import Product, { IProductModel } from "../models/product.model";
import Location from "../models/location.model";
import ApiError from "../utils/apiError";

export const getAllProducts = async (
  query: any = {}
): Promise<{ products: IProductModel[]; total: number }> => {
  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    fields,
    search,

    // Location filters
    location,
    country,
    state,
    city,
    locationType,

    // Date filters
    availableFrom,
    availableUntil,
    travelDate,

    // Other filters
    category,
    difficulty,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    minGroupSize,
    maxGroupSize,
    ...otherFilters
  } = query;

  // Build filter object
  let filterObj: any = { isActive: true };

  // Text search across name, description, and summary
  if (search) {
    filterObj.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  // Location filtering - multiple approaches
  if (location) {
    // Direct location ID
    filterObj.location = location;
  } else if (country || state || city || locationType) {
    // Find locations that match the criteria first
    const locationFilter: any = {};
    if (country) locationFilter.country = country;
    if (state) locationFilter.state = state;
    if (city) locationFilter.city = city;
    if (locationType) locationFilter.type = locationType;

    const matchingLocations = await Location.find(locationFilter).select("_id");
    const locationIds = matchingLocations.map((loc) => loc._id);

    if (locationIds.length > 0) {
      filterObj.location = { $in: locationIds };
    } else {
      // If no locations match, return empty results
      filterObj.location = { $in: [] };
    }
  }

  // Date filtering
  if (travelDate) {
    const targetDate = new Date(travelDate);
    filterObj.availableFrom = { $lte: targetDate };
    filterObj.availableUntil = { $gte: targetDate };
  } else {
    if (availableFrom) {
      filterObj.availableUntil = { $gte: new Date(availableFrom) };
    }
    if (availableUntil) {
      filterObj.availableFrom = { $lte: new Date(availableUntil) };
    }
  }

  // Category filtering
  if (category) {
    filterObj.categories = Array.isArray(category)
      ? { $in: category }
      : category;
  }

  // Difficulty filtering
  if (difficulty) {
    filterObj.difficulty = Array.isArray(difficulty)
      ? { $in: difficulty }
      : difficulty;
  }

  // Price range filtering
  if (minPrice || maxPrice) {
    filterObj.price = {};
    if (minPrice) filterObj.price.$gte = Number(minPrice);
    if (maxPrice) filterObj.price.$lte = Number(maxPrice);
  }

  // Duration range filtering
  if (minDuration || maxDuration) {
    filterObj.duration = {};
    if (minDuration) filterObj.duration.$gte = Number(minDuration);
    if (maxDuration) filterObj.duration.$lte = Number(maxDuration);
  }

  // Group size range filtering
  if (minGroupSize || maxGroupSize) {
    filterObj.maxGroupSize = {};
    if (minGroupSize) filterObj.maxGroupSize.$gte = Number(minGroupSize);
    if (maxGroupSize) filterObj.maxGroupSize.$lte = Number(maxGroupSize);
  }

  // Field limiting
  const fieldsStr = fields ? (fields as string).split(",").join(" ") : "";

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Build sort object
  let sortObj: any = {};
  if (sort) {
    const sortFields = (sort as string).split(",");
    sortFields.forEach((field) => {
      const sortOrder = field.startsWith("-") ? -1 : 1;
      const fieldName = field.replace("-", "");
      sortObj[fieldName] = sortOrder;
    });
  }

  // Execute query with population
  const products = await Product.find(filterObj)
    .populate("categories")
    .populate({
      path: "location",
      select: "name type country state city fullAddress coordinates",
    })
    .select(fieldsStr)
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
