import express from "express";
import * as cartController from "../controllers/cart.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const router = express.Router();

// All cart routes require authentication
router.use(protectRoute);

// GET /api/v1/cart - Get user's cart
// POST /api/v1/cart - Add item to cart
// DELETE /api/v1/cart - Clear entire cart
router
  .route("/")
  .get(cartController.getCart)
  .post(cartController.addToCart)
  .delete(cartController.clearCart);

// PATCH /api/v1/cart/items - Update multiple cart items
// router.patch("/items", cartController.updateCartItem);

// DELETE /api/v1/cart/items/:productId - Remove specific item from cart
router.delete("/items/:productId", cartController.removeFromCart);

// PATCH /api/v1/cart/items/:productId - Update specific cart item
router.patch("/items/:productId", cartController.updateCartItem);

export default router;
