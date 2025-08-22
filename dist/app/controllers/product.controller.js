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
exports.searchProductsHandler = exports.getRelatedProductsHandler = exports.getFeaturedProductsHandler = exports.deleteProductHandler = exports.updateProductHandler = exports.getProductsHandler = exports.getProductHandler = exports.createProductHandler = void 0;
const product_service_1 = require("../services/product.service");
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = require("../utils/apiResponse");
const createProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield (0, product_service_1.createProduct)(req.body);
        (0, apiResponse_1.ApiResponse)(res, 201, 'Product created successfully', { product });
    }
    catch (err) {
        next(err);
    }
});
exports.createProductHandler = createProductHandler;
const getProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield (0, product_service_1.getProduct)(req.params.id);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Product retrieved successfully', { product });
    }
    catch (err) {
        next(err);
    }
});
exports.getProductHandler = getProductHandler;
const getProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield (0, product_service_1.getProducts)(req.query);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Products retrieved successfully', { products });
    }
    catch (err) {
        next(err);
    }
});
exports.getProductsHandler = getProductsHandler;
const updateProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield (0, product_service_1.updateProduct)(req.params.id, req.body);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Product updated successfully', { product });
    }
    catch (err) {
        next(err);
    }
});
exports.updateProductHandler = updateProductHandler;
const deleteProductHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, product_service_1.deleteProduct)(req.params.id);
        (0, apiResponse_1.ApiResponse)(res, 204, 'Product deleted successfully');
    }
    catch (err) {
        next(err);
    }
});
exports.deleteProductHandler = deleteProductHandler;
const getFeaturedProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield (0, product_service_1.getFeaturedProducts)();
        (0, apiResponse_1.ApiResponse)(res, 200, 'Featured products retrieved successfully', { products });
    }
    catch (err) {
        next(err);
    }
});
exports.getFeaturedProductsHandler = getFeaturedProductsHandler;
const getRelatedProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield (0, product_service_1.getRelatedProducts)(req.params.productId);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Related products retrieved successfully', { products });
    }
    catch (err) {
        next(err);
    }
});
exports.getRelatedProductsHandler = getRelatedProductsHandler;
const searchProductsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        if (!query) {
            throw new apiError_1.default('Please provide a search query', 400);
        }
        const products = yield (0, product_service_1.searchProducts)(query);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Products searched successfully', { products });
    }
    catch (err) {
        next(err);
    }
});
exports.searchProductsHandler = searchProductsHandler;
