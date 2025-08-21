import express from 'express';
import {
    createProductHandler,
    getProductHandler,
    getProductsHandler,
    updateProductHandler,
    deleteProductHandler,
    getFeaturedProductsHandler,
    getRelatedProductsHandler,
    searchProductsHandler,
} from '../controllers/product.controller';
import { protectRoute, restrictTo } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.get("/", getProductsHandler);
router.get("/featured", getFeaturedProductsHandler);
router.get("/related/:productId", getRelatedProductsHandler);
router.get("/search", searchProductsHandler);
router.get("/:id", getProductHandler);

// Protect all routes after this middleware
router.use(protectRoute);

// Admin only routes
router.use(restrictTo('admin'));

router.post('/', createProductHandler);
router.patch('/:id', updateProductHandler);
router.delete('/:id', deleteProductHandler);

export default router;