import ApiError from "../utils/apiError";
import Product from "../models/product.model";
import { IProduct } from "../interfaces/product.interface";

export const createProduct = async (productData: IProduct) => {
  const product = await Product.create(productData);
  return product;
};

export const getProduct = async (id: string) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError("No product found with that ID", 404);
  }
  return product;
};

export const getProducts = async (filter: any = {}) => {
  return await Product.find(filter);
};

export const updateProduct = async (
  id: string,
  updateData: Partial<IProduct>
) => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError("No product found with that ID", 404);
  }

  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new ApiError("No product found with that ID", 404);
  }

  return product;
};

export const getFeaturedProducts = async () => {
  return await Product.find({}).sort("-ratingsAverage").limit(8);
};

export const getRelatedProducts = async (productId: string) => {
  const currentProduct = await Product.findById(productId);
  if (!currentProduct) {
    throw new ApiError("No product found with that ID", 404);
  }

  return await Product.find({
    _id: { $ne: productId },
    categories: { $in: currentProduct.categories },
  }).limit(4);
};

export const searchProducts = async (query: string) => {
  return await Product.find({
    $text: { $search: query },
  });
};
