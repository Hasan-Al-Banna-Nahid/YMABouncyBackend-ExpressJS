import { Request, Response, NextFunction } from 'express';
import {
    createProduct,
    getProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getRelatedProducts,
    searchProducts,
} from '../services/product.service';
import { IProduct } from '../interfaces/product.interface';
import ApiError from '../utils/apiError';
import {ApiResponse} from '../utils/apiResponse';

export const createProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await createProduct(req.body);

        ApiResponse(res, 201, 'Product created successfully', { product });
    } catch (err) {
        next(err);
    }
};

export const getProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await getProduct(req.params.id);

        ApiResponse(res, 200, 'Product retrieved successfully', { product });
    } catch (err) {
        next(err);
    }
};

export const getProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await getProducts(req.query);

        ApiResponse(res, 200, 'Products retrieved successfully', { products });
    } catch (err) {
        next(err);
    }
};

export const updateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await updateProduct(req.params.id, req.body);

        ApiResponse(res, 200, 'Product updated successfully', { product });
    } catch (err) {
        next(err);
    }
};

export const deleteProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteProduct(req.params.id);

        ApiResponse(res, 204, 'Product deleted successfully');
    } catch (err) {
        next(err);
    }
};

export const getFeaturedProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await getFeaturedProducts();

        ApiResponse(res, 200, 'Featured products retrieved successfully', { products });
    } catch (err) {
        next(err);
    }
};

export const getRelatedProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await getRelatedProducts(req.params.productId);

        ApiResponse(res, 200, 'Related products retrieved successfully', { products });
    } catch (err) {
        next(err);
    }
};

export const searchProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query;
        if (!query) {
            throw new ApiError('Please provide a search query', 400);
        }

        const products = await searchProducts(query as string);

        ApiResponse(res, 200, 'Products searched successfully', { products });
    } catch (err) {
        next(err);
    }
};