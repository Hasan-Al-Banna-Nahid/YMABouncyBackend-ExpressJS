"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookingHandler =
  exports.updateBookingHandler =
  exports.checkAvailabilityHandler =
  exports.getBookingsByProductHandler =
  exports.getBookingsByDateRangeHandler =
  exports.getBookingsHandler =
  exports.getBookingHandler =
  exports.createBookingHandler =
    void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const throw ApiError_1 = __importDefault(require("../utils/throw ApiError"));
// Safely get the owner's id whether booking.user is ObjectId or a populated doc
function bookingOwnerId(booking) {
  const u = booking.user;
  if (u && typeof u === "object" && u._id) return u._id.toString();
  return u.toString();
}
function ensureAuth(req) {
  const aReq = req;
  if (!aReq.user || !aReq.user.id) {
    new throw ApiError_1.default("User not authenticated", 401);
  }
}
function parseISODate(value, field) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime()))
    new throw ApiError_1.default(`Invalid ${field}`, 400);
  return d;
}
/** POST /bookings */
const createBookingHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const {
      product,
      price,
      startDate,
      endDate,
      deliveryAddress,
      deliveryTime,
      specialRequests,
    } = req.body;
    if (!product) new throw ApiError_1.default("product is required", 400);
    if (!price) new throw ApiError_1.default("price is required", 400);
    if (!startDate) new throw ApiError_1.default("startDate is required", 400);
    if (!endDate) new throw ApiError_1.default("endDate is required", 400);
    if (!deliveryAddress)
      new throw ApiError_1.default("deliveryAddress is required", 400);
    if (!deliveryTime) new throw ApiError_1.default("deliveryTime is required", 400);
    const start = parseISODate(startDate, "startDate");
    const end = parseISODate(endDate, "endDate");
    if (end < start)
      new throw ApiError_1.default("endDate must be after startDate", 400);
    const booking = await booking_model_1.default.create({
      product: new mongoose_1.default.Types.ObjectId(product),
      user: req.user.id, // string OK; Mongoose will cast to ObjectId
      price,
      startDate: start,
      endDate: end,
      deliveryAddress,
      deliveryTime,
      specialRequests,
    });
    res.status(201).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
};
exports.createBookingHandler = createBookingHandler;
/** GET /bookings/:id */
const getBookingHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const booking = await booking_model_1.default.findById(req.params.id);
    if (!booking) new throw ApiError_1.default("Booking not found", 404);
    const ownerId = bookingOwnerId(booking);
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      new throw ApiError_1.default("Unauthorized", 403);
    }
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    next(err);
  }
};
exports.getBookingHandler = getBookingHandler;
/** GET /bookings */
const getBookingsHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const query = req.user.role === "admin" ? {} : { user: req.user.id }; // current user's bookings only
    const bookings = await booking_model_1.default.find(query);
    res
      .status(200)
      .json({
        status: "success",
        results: bookings.length,
        data: { bookings },
      });
  } catch (err) {
    next(err);
  }
};
exports.getBookingsHandler = getBookingsHandler;
/** GET /bookings/date-range?startDate=...&endDate=... */
const getBookingsByDateRangeHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      new throw ApiError_1.default("startDate and endDate are required", 400);
    const start = parseISODate(startDate, "startDate");
    const end = parseISODate(endDate, "endDate");
    if (end < start)
      new throw ApiError_1.default("endDate must be after startDate", 400);
    const base = {
      startDate: { $lte: end }, // starts before or on requested end
      endDate: { $gte: start }, // ends after or on requested start
    };
    if (req.user.role !== "admin") {
      base.user = req.user.id;
    }
    const bookings = await booking_model_1.default.find(base);
    res
      .status(200)
      .json({
        status: "success",
        results: bookings.length,
        data: { bookings },
      });
  } catch (err) {
    next(err);
  }
};
exports.getBookingsByDateRangeHandler = getBookingsByDateRangeHandler;
/** GET /bookings/product/:productId */
const getBookingsByProductHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const { productId } = req.params;
    if (!productId) new throw ApiError_1.default("productId is required", 400);
    const filter = {
      product: new mongoose_1.default.Types.ObjectId(productId),
    };
    // Non-admins only see their own bookings for the product
    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }
    const bookings = await booking_model_1.default.find(filter);
    res
      .status(200)
      .json({
        status: "success",
        results: bookings.length,
        data: { bookings },
      });
  } catch (err) {
    next(err);
  }
};
exports.getBookingsByProductHandler = getBookingsByProductHandler;
/** GET /bookings/check-availability?productId=...&startDate=...&endDate=... */
const checkAvailabilityHandler = async (req, res, next) => {
  try {
    const { productId, startDate, endDate } = req.query;
    if (!productId) new throw ApiError_1.default("productId is required", 400);
    if (!startDate || !endDate)
      new throw ApiError_1.default("startDate and endDate are required", 400);
    const start = parseISODate(startDate, "startDate");
    const end = parseISODate(endDate, "endDate");
    if (end < start)
      new throw ApiError_1.default("endDate must be after startDate", 400);
    // Overlap if existing.start <= requested.end && existing.end >= requested.start
    const conflict = await booking_model_1.default.findOne({
      product: new mongoose_1.default.Types.ObjectId(String(productId)),
      status: { $ne: "cancelled" },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
    res.status(200).json({
      status: "success",
      data: {
        available: !conflict,
        conflictId: conflict?._id ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.checkAvailabilityHandler = checkAvailabilityHandler;
/** PATCH /bookings/:id */
const updateBookingHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const booking = await booking_model_1.default.findById(req.params.id);
    if (!booking) new throw ApiError_1.default("Booking not found", 404);
    const ownerId = bookingOwnerId(booking);
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      new throw ApiError_1.default("Unauthorized", 403);
    }
    const {
      status,
      startDate,
      endDate,
      deliveryAddress,
      deliveryTime,
      specialRequests,
    } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (startDate) updates.startDate = parseISODate(startDate, "startDate");
    if (endDate) updates.endDate = parseISODate(endDate, "endDate");
    if (deliveryAddress) updates.deliveryAddress = deliveryAddress;
    if (deliveryTime) updates.deliveryTime = deliveryTime;
    if (typeof specialRequests !== "undefined")
      updates.specialRequests = specialRequests;
    if (
      updates.startDate &&
      updates.endDate &&
      updates.endDate < updates.startDate
    ) {
      new throw ApiError_1.default("endDate must be after startDate", 400);
    }
    const updated = await booking_model_1.default.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({ status: "success", data: { booking: updated } });
  } catch (err) {
    next(err);
  }
};
exports.updateBookingHandler = updateBookingHandler;
/** DELETE /bookings/:id */
const deleteBookingHandler = async (req, res, next) => {
  try {
    ensureAuth(req);
    const booking = await booking_model_1.default.findById(req.params.id);
    if (!booking) new throw ApiError_1.default("Booking not found", 404);
    const ownerId = bookingOwnerId(booking);
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      new throw ApiError_1.default("Unauthorized", 403);
    }
    await booking_model_1.default.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    next(err);
  }
};
exports.deleteBookingHandler = deleteBookingHandler;
