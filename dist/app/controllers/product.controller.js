"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProductsHandler =
  exports.getRelatedProductsHandler =
  exports.getFeaturedProductsHandler =
  exports.deleteProductHandler =
  exports.updateProductHandler =
  exports.getProductsHandler =
  exports.getProductHandler =
  exports.createProductHandler =
    void 0;
const product_service_1 = require("../services/product.service");
const throw ApiError_1 = __importDefault(require("../utils/throw ApiError"));
const apiResponse_1 = require("../utils/apiResponse");
const createProductHandler = async (req, res, next) => {
  try {
    const product = await (0, product_service_1.createProduct)(req.body);
    (0, apiResponse_1.ApiResponse)(res, 201, "Product created successfully", {
      product,
    });
  } catch (err) {
    next(err);
  }
};
exports.createProductHandler = createProductHandler;
const getProductHandler = async (req, res, next) => {
  try {
    const product = await (0, product_service_1.getProduct)(req.params.id);
    (0, apiResponse_1.ApiResponse)(res, 200, "Product retrieved successfully", {
      product,
    });
  } catch (err) {
    next(err);
  }
};
exports.getProductHandler = getProductHandler;
const getProductsHandler = async (req, res, next) => {
  try {
    const products = await (0, product_service_1.getProducts)(req.query);
    (0, apiResponse_1.ApiResponse)(
      res,
      200,
      "Products retrieved successfully",
      { products }
    );
  } catch (err) {
    next(err);
  }
};
exports.getProductsHandler = getProductsHandler;
const updateProductHandler = async (req, res, next) => {
  try {
    const product = await (0, product_service_1.updateProduct)(
      req.params.id,
      req.body
    );
    (0, apiResponse_1.ApiResponse)(res, 200, "Product updated successfully", {
      product,
    });
  } catch (err) {
    next(err);
  }
};
exports.updateProductHandler = updateProductHandler;
const deleteProductHandler = async (req, res, next) => {
  try {
    await (0, product_service_1.deleteProduct)(req.params.id);
    (0, apiResponse_1.ApiResponse)(res, 204, "Product deleted successfully");
  } catch (err) {
    next(err);
  }
};
exports.deleteProductHandler = deleteProductHandler;
const getFeaturedProductsHandler = async (req, res, next) => {
  try {
    const products = await (0, product_service_1.getFeaturedProducts)();
    (0, apiResponse_1.ApiResponse)(
      res,
      200,
      "Featured products retrieved successfully",
      { products }
    );
  } catch (err) {
    next(err);
  }
};
exports.getFeaturedProductsHandler = getFeaturedProductsHandler;
const getRelatedProductsHandler = async (req, res, next) => {
  try {
    const products = await (0, product_service_1.getRelatedProducts)(
      req.params.productId
    );
    (0, apiResponse_1.ApiResponse)(
      res,
      200,
      "Related products retrieved successfully",
      { products }
    );
  } catch (err) {
    next(err);
  }
};
exports.getRelatedProductsHandler = getRelatedProductsHandler;
const searchProductsHandler = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      new throw ApiError_1.default("Please provide a search query", 400);
    }
    const products = await (0, product_service_1.searchProducts)(query);
    (0, apiResponse_1.ApiResponse)(res, 200, "Products searched successfully", {
      products,
    });
  } catch (err) {
    next(err);
  }
};
exports.searchProductsHandler = searchProductsHandler;
