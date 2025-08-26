import { FilterQuery } from "mongoose";
import ApiError from "../utils/apiError";
import Booking from "../models/booking.model";
import Inventory from "../models/inventory.model";
import { IBooking } from "../interfaces/booking.interface";
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

export const getBooking = async (id: string) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError("No booking found with that ID", 404);
  }
  return booking;
};

export const getBookings = async (filter: FilterQuery<IBooking> = {}) => {
  return await Booking.find(filter);
};

export const getBookingsByDateRange = async (
  startDate: Date,
  endDate: Date
) => {
  return await Booking.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
  });
};

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

export const deleteBooking = async (id: string) => {
  const booking = await Booking.findByIdAndDelete(id);

  if (!booking) {
    throw new ApiError("No booking found with that ID", 404);
  }

  // Update inventory status back to available
  await Inventory.updateMany(
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

export const getBookingsByUser = async (userId: string) => {
  return await Booking.find({ user: userId });
};

export const getBookingsByProduct = async (productId: string) => {
  return await Booking.find({ product: productId });
};

export const checkAvailability = async (
  productId: string,
  startDate: Date,
  endDate: Date
) => {
  const availableItems = await Inventory.find({
    product: productId,
    date: { $gte: startDate, $lte: endDate },
    status: "available",
  });

  return {
    available: availableItems.length > 0,
    availableDates: availableItems.map((item) => item.date),
  };
};
