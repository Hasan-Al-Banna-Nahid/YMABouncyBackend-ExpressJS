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

export const addToCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const { productId, quantity } = req.body;

    const cart = await cartService.addItemToCart(userId, productId, quantity);

    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  }
);

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user._id.toString();
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(userId, productId, quantity);

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
