// src/routes/cart.routes.ts
import express from "express";
import * as cartController from "../controllers/cart.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const router = express.Router();

// All cart routes require authentication
router.use(protectRoute);

router
  .route("/")
  .get(cartController.getCart)
  .post(cartController.addToCart)
  .delete(cartController.clearCart);

router
  .route("/:productId")
  .patch(cartController.updateCartItem)
  .delete(cartController.removeFromCart);

export default router;
