"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability =
  exports.getBookingsByProduct =
  exports.getBookingsByUser =
  exports.deleteBooking =
  exports.getBookingsByDateRange =
  exports.getBookings =
  exports.getBooking =
    void 0;
const throw ApiError_1 = __importDefault(require("../utils/throw ApiError"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const inventory_model_1 = __importDefault(require("../models/inventory.model"));
// import { sendEmail } from './email.service';
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
//          new throw ApiError('No available inventory for the selected dates', 400);
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
const getBooking = async (id) => {
  const booking = await booking_model_1.default.findById(id);
  if (!booking) {
    new throw ApiError_1.default("No booking found with that ID", 404);
  }
  return booking;
};
exports.getBooking = getBooking;
const getBookings = async (filter = {}) => {
  return await booking_model_1.default.find(filter);
};
exports.getBookings = getBookings;
const getBookingsByDateRange = async (startDate, endDate) => {
  return await booking_model_1.default.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
  });
};
exports.getBookingsByDateRange = getBookingsByDateRange;
// export const updateBooking = async (id: string, updateData: Partial<IBooking>) => {
//     const booking = await Booking.findByIdAndUpdate(id, updateData, {
//         new: true,
//         runValidators: true,
//     });
//
//     if (!booking) {
//          new throw ApiError('No booking found with that ID', 404);
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
const deleteBooking = async (id) => {
  const booking = await booking_model_1.default.findByIdAndDelete(id);
  if (!booking) {
    new throw ApiError_1.default("No booking found with that ID", 404);
  }
  // Update inventory status back to available
  await inventory_model_1.default.updateMany(
    {
      bookings: booking._id,
    },
    {
      $set: { status: "available" },
      $pull: { bookings: booking._id },
    }
  );
  return booking;
};
exports.deleteBooking = deleteBooking;
const getBookingsByUser = async (userId) => {
  return await booking_model_1.default.find({ user: userId });
};
exports.getBookingsByUser = getBookingsByUser;
const getBookingsByProduct = async (productId) => {
  return await booking_model_1.default.find({ product: productId });
};
exports.getBookingsByProduct = getBookingsByProduct;
const checkAvailability = async (productId, startDate, endDate) => {
  const availableItems = await inventory_model_1.default.find({
    product: productId,
    date: { $gte: startDate, $lte: endDate },
    status: "available",
  });
  return {
    available: availableItems.length > 0,
    availableDates: availableItems.map((item) => item.date),
  };
};
exports.checkAvailability = checkAvailability;
