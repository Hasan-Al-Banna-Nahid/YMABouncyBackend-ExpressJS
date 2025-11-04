import express from "express";
import {
  createOrder,
  getOrder,
  getMyOrders,
} from "../controllers/checkout.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(protectRoute);

router.post("/order", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrder);

export default router;
