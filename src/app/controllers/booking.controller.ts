// src/controllers/booking.controller.ts
import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import Booking from '../models/booking.model';
import ApiError from '../utils/apiError';
import { IUser } from '../interfaces/user.interface';

// Narrow req.user everywhere in this controller to have id and role
type Role = 'user' | 'admin';
type AuthenticatedRequest = Request & { user: IUser & { id: string; role: Role } };

// Safely get the owner's id whether booking.user is ObjectId or a populated doc
function bookingOwnerId(booking: { user: Types.ObjectId | { _id: Types.ObjectId } }): string {
    const u: any = booking.user;
    if (u && typeof u === 'object' && u._id) return (u._id as Types.ObjectId).toString();
    return (u as Types.ObjectId).toString();
}

function ensureAuth(req: Request): asserts req is AuthenticatedRequest {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user || !aReq.user.id) {
        throw new ApiError('User not authenticated', 401);
    }
}

function parseISODate(value: any, field: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new ApiError(`Invalid ${field}`, 400);
    return d;
}

/** POST /bookings */
export const createBookingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);
        const { product, price, startDate, endDate, deliveryAddress, deliveryTime, specialRequests } = req.body;

        if (!product) throw new ApiError('product is required', 400);
        if (!price) throw new ApiError('price is required', 400);
        if (!startDate) throw new ApiError('startDate is required', 400);
        if (!endDate) throw new ApiError('endDate is required', 400);
        if (!deliveryAddress) throw new ApiError('deliveryAddress is required', 400);
        if (!deliveryTime) throw new ApiError('deliveryTime is required', 400);

        const start = parseISODate(startDate, 'startDate');
        const end = parseISODate(endDate, 'endDate');
        if (end < start) throw new ApiError('endDate must be after startDate', 400);

        const booking = await Booking.create({
            product: new mongoose.Types.ObjectId(product),
            user: req.user.id, // string OK; Mongoose will cast to ObjectId
            price,
            startDate: start,
            endDate: end,
            deliveryAddress,
            deliveryTime,
            specialRequests,
        });

        res.status(201).json({ status: 'success', data: { booking } });
    } catch (err) {
        next(err);
    }
};

/** GET /bookings/:id */
export const getBookingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);
        const booking = await Booking.findById(req.params.id);
        if (!booking) throw new ApiError('Booking not found', 404);

        const ownerId = bookingOwnerId(booking);
        if (ownerId !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Unauthorized', 403);
        }

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (err) {
        next(err);
    }
};

/** GET /bookings */
export const getBookingsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);

        const query =
            req.user.role === 'admin'
                ? {}
                : { user: req.user.id }; // current user's bookings only

        const bookings = await Booking.find(query as any);
        res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
    } catch (err) {
        next(err);
    }
};

/** GET /bookings/date-range?startDate=...&endDate=... */
export const getBookingsByDateRangeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);

        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) throw new ApiError('startDate and endDate are required', 400);

        const start = parseISODate(startDate, 'startDate');
        const end = parseISODate(endDate, 'endDate');
        if (end < start) throw new ApiError('endDate must be after startDate', 400);

        const base: any = {
            startDate: { $lte: end }, // starts before or on requested end
            endDate: { $gte: start }, // ends after or on requested start
        };

        if (req.user.role !== 'admin') {
            base.user = req.user.id;
        }

        const bookings = await Booking.find(base);
        res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
    } catch (err) {
        next(err);
    }
};

/** GET /bookings/product/:productId */
export const getBookingsByProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);

        const { productId } = req.params;
        if (!productId) throw new ApiError('productId is required', 400);

        const filter: any = { product: new mongoose.Types.ObjectId(productId) };

        // Non-admins only see their own bookings for the product
        if (req.user.role !== 'admin') {
            filter.user = req.user.id;
        }

        const bookings = await Booking.find(filter);
        res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
    } catch (err) {
        next(err);
    }
};

/** GET /bookings/check-availability?productId=...&startDate=...&endDate=... */
export const checkAvailabilityHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, startDate, endDate } = req.query;
        if (!productId) throw new ApiError('productId is required', 400);
        if (!startDate || !endDate) throw new ApiError('startDate and endDate are required', 400);

        const start = parseISODate(startDate, 'startDate');
        const end = parseISODate(endDate, 'endDate');
        if (end < start) throw new ApiError('endDate must be after startDate', 400);

        // Overlap if existing.start <= requested.end && existing.end >= requested.start
        const conflict = await Booking.findOne({
            product: new mongoose.Types.ObjectId(String(productId)),
            status: { $ne: 'cancelled' },
            startDate: { $lte: end },
            endDate: { $gte: start },
        });

        res.status(200).json({
            status: 'success',
            data: {
                available: !conflict,
                conflictId: conflict?._id ?? null,
            },
        });
    } catch (err) {
        next(err);
    }
};

/** PATCH /bookings/:id */
export const updateBookingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);

        const booking = await Booking.findById(req.params.id);
        if (!booking) throw new ApiError('Booking not found', 404);

        const ownerId = bookingOwnerId(booking);
        if (ownerId !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Unauthorized', 403);
        }

        const { status, startDate, endDate, deliveryAddress, deliveryTime, specialRequests } = req.body;

        const updates: any = {};
        if (status) updates.status = status;
        if (startDate) updates.startDate = parseISODate(startDate, 'startDate');
        if (endDate) updates.endDate = parseISODate(endDate, 'endDate');
        if (deliveryAddress) updates.deliveryAddress = deliveryAddress;
        if (deliveryTime) updates.deliveryTime = deliveryTime;
        if (typeof specialRequests !== 'undefined') updates.specialRequests = specialRequests;

        if (updates.startDate && updates.endDate && updates.endDate < updates.startDate) {
            throw new ApiError('endDate must be after startDate', 400);
        }

        const updated = await Booking.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ status: 'success', data: { booking: updated } });
    } catch (err) {
        next(err);
    }
};

/** DELETE /bookings/:id */
export const deleteBookingHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        ensureAuth(req);

        const booking = await Booking.findById(req.params.id);
        if (!booking) throw new ApiError('Booking not found', 404);

        const ownerId = bookingOwnerId(booking);
        if (ownerId !== req.user.id && req.user.role !== 'admin') {
            throw new ApiError('Unauthorized', 403);
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        next(err);
    }
};
