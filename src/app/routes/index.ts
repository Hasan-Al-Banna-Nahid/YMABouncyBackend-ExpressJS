import express from "express";
import authRouter from "./auth.route";
import bookingRouter from "./booking.route";
import inventoryRouter from "./inventory.route";
import invoiceRouter from "./invoice.route";
import productRouter from "./product.route";
import adminRoutes from "./admin.routes";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/bookings", bookingRouter);
router.use("/inventory", inventoryRouter);
router.use("/invoices", invoiceRouter);
router.use("/products", productRouter);
router.use("/api/v1/admin", adminRoutes);

export default router;
