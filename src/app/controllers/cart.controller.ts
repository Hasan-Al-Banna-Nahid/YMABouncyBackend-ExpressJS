// src/controllers/cart.controller.ts
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import * as cartService from "../services/cart.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const getCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const cart = await cartService.getCartByUserId(userId);

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);

// src/controllers/cart.controller.ts
export const addToCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const { items, productId, quantity, startDate, endDate } = req.body;

    let cart;
    if (Array.isArray(items)) {
      // Multiple items
      cart = await cartService.addMultipleItemsToCart(userId, items);
    } else {
      // Single item (backward compatibility)
      cart = await cartService.addItemToCart(
        userId,
        productId,
        quantity,
        startDate,
        endDate
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);

// src/controllers/cart.controller.ts
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const { items } = req.body;

    let cart;

    if (Array.isArray(items)) {
      // Multiple items update
      cart = await cartService.updateMultipleCartItems(userId, items);
    } else {
      // Single item update (backward compatibility)
      const { productId } = req.params;
      const { quantity, startDate, endDate } = req.body;

      cart = await cartService.updateCartItem(
        userId,
        productId,
        quantity,
        startDate,
        endDate
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const { productId } = req.params;

    const cart = await cartService.removeItemFromCart(userId, productId);

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);

export const clearCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();

    const cart = await cartService.clearCart(userId);

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);
