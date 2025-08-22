"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getRelatedProducts = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.getProducts = exports.getProduct = exports.createProduct = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const product_model_1 = __importDefault(require("../models/product.model"));
const createProduct = (productData) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.create(productData);
    return product;
});
exports.createProduct = createProduct;
const getProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(id);
    if (!product) {
        throw new apiError_1.default('No product found with that ID', 404);
    }
    return product;
});
exports.getProduct = getProduct;
const getProducts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    return yield product_model_1.default.find(filter);
});
exports.getProducts = getProducts;
const updateProduct = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        throw new apiError_1.default('No product found with that ID', 404);
    }
    return product;
});
exports.updateProduct = updateProduct;
const deleteProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findByIdAndDelete(id);
    if (!product) {
        throw new apiError_1.default('No product found with that ID', 404);
    }
    return product;
});
exports.deleteProduct = deleteProduct;
const getFeaturedProducts = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.find({}).sort('-ratingsAverage').limit(8);
});
exports.getFeaturedProducts = getFeaturedProducts;
const getRelatedProducts = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const currentProduct = yield product_model_1.default.findById(productId);
    if (!currentProduct) {
        throw new apiError_1.default('No product found with that ID', 404);
    }
    return yield product_model_1.default.find({
        _id: { $ne: productId },
        categories: { $in: currentProduct.categories },
    }).limit(4);
});
exports.getRelatedProducts = getRelatedProducts;
const searchProducts = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return yield product_model_1.default.find({
        $text: { $search: query },
    });
});
exports.searchProducts = searchProducts;
