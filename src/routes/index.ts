import express from 'express';
import authRouter from './auth.route';
import bookingRouter from './booking.route';
import inventoryRouter from './inventory.route';
import invoiceRouter from './invoice.route';
import productRouter from './product.route';

const router = express.Router();

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/bookings', bookingRouter);
router.use('/api/v1/inventory', inventoryRouter);
router.use('/api/v1/invoices', invoiceRouter);
router.use('/api/v1/products', productRouter);

export default router;