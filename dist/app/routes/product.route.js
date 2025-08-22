"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.get("/", product_controller_1.getProductsHandler);
router.get("/featured", product_controller_1.getFeaturedProductsHandler);
router.get("/related/:productId", product_controller_1.getRelatedProductsHandler);
router.get("/search", product_controller_1.searchProductsHandler);
router.get("/:id", product_controller_1.getProductHandler);
// Protect all routes after this middleware
router.use(auth_middleware_1.protectRoute);
// Admin only routes
router.use((0, auth_middleware_1.restrictTo)('admin'));
router.post('/', product_controller_1.createProductHandler);
router.patch('/:id', product_controller_1.updateProductHandler);
router.delete('/:id', product_controller_1.deleteProductHandler);
exports.default = router;
