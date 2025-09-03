"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getRelatedProducts = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getProducts = exports.getProduct = exports.createProduct = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const product_model_1 = __importDefault(require("../models/product.model"));
const createProduct = async (productData) => {
    const product = await product_model_1.default.create(productData);
    return product;
};
exports.createProduct = createProduct;
const getProduct = async (id) => {
    const product = await product_model_1.default.findById(id);
    if (!product) {
        throw new apiError_1.default("No product found with that ID", 404);
    }
    return product;
};
exports.getProduct = getProduct;
const getProducts = async (filter = {}) => {
    return await product_model_1.default.find(filter);
};
exports.getProducts = getProducts;
const updateProduct = async (id, updateData) => {
    const product = await product_model_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        throw new apiError_1.default("No product found with that ID", 404);
    }
    return product;
};
exports.updateProduct = updateProduct;
const deleteProduct = async (id) => {
    const product = await product_model_1.default.findByIdAndDelete(id);
    if (!product) {
        throw new apiError_1.default("No product found with that ID", 404);
    }
    return product;
};
exports.deleteProduct = deleteProduct;
const getFeaturedProducts = async () => {
    return await product_model_1.default.find({}).sort("-ratingsAverage").limit(8);
};
exports.getFeaturedProducts = getFeaturedProducts;
const getRelatedProducts = async (productId) => {
    const currentProduct = await product_model_1.default.findById(productId);
    if (!currentProduct) {
        throw new apiError_1.default("No product found with that ID", 404);
    }
    return await product_model_1.default.find({
        _id: { $ne: productId },
        categories: { $in: currentProduct.categories },
    }).limit(4);
};
exports.getRelatedProducts = getRelatedProducts;
const searchProducts = async (query) => {
    return await product_model_1.default.find({
        $text: { $search: query },
    });
};
exports.searchProducts = searchProducts;
