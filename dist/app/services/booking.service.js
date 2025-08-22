"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = exports.getBookingsByProduct = exports.getBookingsByUser = exports.deleteBooking = exports.getBookingsByDateRange = exports.getBookings = exports.getBooking = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const inventory_model_1 = __importDefault(require("../models/inventory.model"));
// export const createBooking = async (bookingData: IBooking) => {
//     // 1) Check inventory availability for the selected dates
//     const startDate = new Date(bookingData.startDate);
//     const endDate = new Date(bookingData.endDate);
//
//     // Get all inventory items for this product between the dates
//     const inventoryItems = await Inventory.find({
//         product: bookingData.product,
//         date: { $gte: startDate, $lte: endDate },
//         status: 'available',
//     });
//
//     if (inventoryItems.length === 0) {
//         throw new ApiError('No available inventory for the selected dates', 400);
//     }
//
//     // 2) Create booking
//     const booking = await Booking.create(bookingData);
//
//     // 3) Update inventory status to booked
//     await Inventory.updateMany(
//         {
//             product: bookingData.product,
//             date: { $gte: startDate, $lte: endDate },
//         },
//         {
//             $set: { status: 'booked' },
//             $addToSet: { bookings: booking._id },
//         }
//     );
//
//     // 4) Send booking confirmation email
//     await sendEmail({
//         email: booking.user.email,
//         subject: 'Your Booking Confirmation',
//         template: 'bookingConfirmation',
//         templateVars: {
//             name: booking.user.name,
//             productName: booking.product.name,
//             startDate: booking.startDate.toLocaleDateString(),
//             endDate: booking.endDate.toLocaleDateString(),
//             price: booking.price,
//         },
//     });
//
//     return booking;
// };
const getBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield booking_model_1.default.findById(id);
    if (!booking) {
        throw new apiError_1.default('No booking found with that ID', 404);
    }
    return booking;
});
exports.getBooking = getBooking;
const getBookings = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    return yield booking_model_1.default.find(filter);
});
exports.getBookings = getBookings;
const getBookingsByDateRange = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return yield booking_model_1.default.find({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
    });
});
exports.getBookingsByDateRange = getBookingsByDateRange;
// export const updateBooking = async (id: string, updateData: Partial<IBooking>) => {
//     const booking = await Booking.findByIdAndUpdate(id, updateData, {
//         new: true,
//         runValidators: true,
//     });
//
//     if (!booking) {
//         throw new ApiError('No booking found with that ID', 404);
//     }
//
//     // If status was updated to confirmed, send confirmation email
//     if (updateData.status === 'confirmed') {
//         await sendEmail({
//             email: booking.user.email,
//             subject: 'Your Booking Has Been Confirmed',
//             template: 'bookingConfirmed',
//             templateVars: {
//                 name: booking.user.name,
//                 productName: booking.product.name,
//                 startDate: booking.startDate.toLocaleDateString(),
//                 endDate: booking.endDate.toLocaleDateString(),
//                 price: booking.price,
//             },
//         });
//     }
//
//     return booking;
// };
const deleteBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield booking_model_1.default.findByIdAndDelete(id);
    if (!booking) {
        throw new apiError_1.default('No booking found with that ID', 404);
    }
    // Update inventory status back to available
    yield inventory_model_1.default.updateMany({
        bookings: booking._id,
    }, {
        $set: { status: 'available' },
        $pull: { bookings: booking._id },
    });
    return booking;
});
exports.deleteBooking = deleteBooking;
const getBookingsByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield booking_model_1.default.find({ user: userId });
});
exports.getBookingsByUser = getBookingsByUser;
const getBookingsByProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield booking_model_1.default.find({ product: productId });
});
exports.getBookingsByProduct = getBookingsByProduct;
const checkAvailability = (productId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const availableItems = yield inventory_model_1.default.find({
        product: productId,
        date: { $gte: startDate, $lte: endDate },
        status: 'available',
    });
    return {
        available: availableItems.length > 0,
        availableDates: availableItems.map((item) => item.date),
    };
});
exports.checkAvailability = checkAvailability;
