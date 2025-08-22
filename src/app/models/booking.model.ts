import mongoose, { Document, Schema } from 'mongoose';
import { IBooking } from '../interfaces/booking.interface';

export interface IBookingModel extends IBooking, Document {}

const bookingSchema: Schema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: [true, 'Booking must belong to a product'] },
        user:    { type: Schema.Types.ObjectId, ref: 'User',    required: [true, 'Booking must belong to a user'] },
        price:   { type: Number, required: [true, 'Booking must have a price'] },
        paid:    { type: Boolean, default: true },
        status:  { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
        startDate: { type: Date, required: [true, 'Booking must have a start date'] },
        endDate:   { type: Date, required: [true, 'Booking must have an end date'] },
        deliveryAddress: { type: String, required: [true, 'Booking must have a delivery address'] },
        deliveryTime:    { type: String, required: [true, 'Booking must have a delivery time'] },
        specialRequests: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
bookingSchema.index({ product: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Auto-populate product & user (include _id explicitly to be safe)
bookingSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
    this.populate('product').populate({
        path: 'user',
        select: '_id name email photo',
    });
    next();
});

const Booking = mongoose.model<IBookingModel>('Booking', bookingSchema);
export default Booking;
