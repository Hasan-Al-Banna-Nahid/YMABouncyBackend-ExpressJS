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
  let locationMatch: any = {};

  if (country) locationMatch.country = { $regex: country, $options: "i" };
  if (state) locationMatch.state = { $regex: state, $options: "i" };
  if (city) locationMatch.city = { $regex: city, $options: "i" };
  if (locationType) locationMatch.type = locationType;

  // If we have any location filters, use aggregation pipeline
  const hasLocationFilters =
    country || state || city || locationType || location;

  if (hasLocationFilters) {
    // Build aggregation pipeline for location-based filtering
    const aggregationPipeline: any[] = [
      // Match active products first
      { $match: { isActive: true } },

      // Lookup location data
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "locationData",
        },
      },
      { $unwind: "$locationData" },

      // Add location fields to product for filtering
      {
        $addFields: {
          locationCountry: "$locationData.country",
          locationState: "$locationData.state",
          locationCity: "$locationData.city",
          locationType: "$locationData.type",
        },
      },
    ];

    // Add text search if provided
    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { summary: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add location filtering
    const locationFilters: any = {};
    if (country)
      locationFilters["locationData.country"] = {
        $regex: country,
        $options: "i",
      };
    if (state)
      locationFilters["locationData.state"] = { $regex: state, $options: "i" };
    if (city)
      locationFilters["locationData.city"] = { $regex: city, $options: "i" };
    if (locationType) locationFilters["locationData.type"] = locationType;
    if (location) locationFilters["location"] = location;

    if (Object.keys(locationFilters).length > 0) {
      aggregationPipeline.push({ $match: locationFilters });
    }

    // Add date filtering
    const dateFilters: any = {};
    if (travelDate) {
      const targetDate = new Date(travelDate);
      dateFilters.availableFrom = { $lte: targetDate };
      dateFilters.availableUntil = { $gte: targetDate };
    } else {
      if (availableFrom) {
        dateFilters.availableUntil = { $gte: new Date(availableFrom) };
      }
      if (availableUntil) {
        dateFilters.availableFrom = { $lte: new Date(availableUntil) };
      }
    }
    if (Object.keys(dateFilters).length > 0) {
      aggregationPipeline.push({ $match: dateFilters });
    }

    // Add other filters
    const otherFiltersObj: any = {};
    if (category) {
      otherFiltersObj.categories = Array.isArray(category)
        ? { $in: category }
        : category;
    }
    if (difficulty) {
      otherFiltersObj.difficulty = Array.isArray(difficulty)
        ? { $in: difficulty }
        : difficulty;
    }
    if (minPrice || maxPrice) {
      otherFiltersObj.price = {};
      if (minPrice) otherFiltersObj.price.$gte = Number(minPrice);
      if (maxPrice) otherFiltersObj.price.$lte = Number(maxPrice);
    }
    if (minDuration || maxDuration) {
      otherFiltersObj.duration = {};
      if (minDuration) otherFiltersObj.duration.$gte = Number(minDuration);
      if (maxDuration) otherFiltersObj.duration.$lte = Number(maxDuration);
    }
    if (minGroupSize || maxGroupSize) {
      otherFiltersObj.maxGroupSize = {};
      if (minGroupSize)
        otherFiltersObj.maxGroupSize.$gte = Number(minGroupSize);
      if (maxGroupSize)
        otherFiltersObj.maxGroupSize.$lte = Number(maxGroupSize);
    }
    if (Object.keys(otherFiltersObj).length > 0) {
      aggregationPipeline.push({ $match: otherFiltersObj });
    }

    // Add sorting
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
    aggregationPipeline.push({ $sort: sortObj });

    // Add pagination
    const skip = (Number(page) - 1) * Number(limit);
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: Number(limit) });

    // Lookup categories and location again for populated data
    aggregationPipeline.push({
      $lookup: {
        from: "categories",
        localField: "categories",
        foreignField: "_id",
        as: "categories",
      },
    });

    // Execute aggregation for products
    const products = await Product.aggregate(aggregationPipeline);

    // Get total count with same filters (excluding pagination)
    const countPipeline = [...aggregationPipeline];
    countPipeline.splice(countPipeline.length - 4, 4); // Remove sort, skip, limit, and last lookup
    countPipeline.push({ $count: "total" });

    const countResult = await Product.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return { products: products as IProductModel[], total };
  } else {
    // Original query for non-location filtering (faster)

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

    // Direct location ID filter
    if (location) {
      filterObj.location = location;
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
  }
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
