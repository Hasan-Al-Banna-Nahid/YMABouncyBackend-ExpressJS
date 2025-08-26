import mongoose from 'mongoose';
import { IUser } from './user.interface';

// Allow `user` to be either an ObjectId or a populated IUser doc
export interface IBooking {
    product: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId | (IUser & { _id: mongoose.Types.ObjectId });
    price: number;
    paid?: boolean;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    startDate: Date;
    endDate: Date;
    deliveryAddress: string;
    deliveryTime: string;
    specialRequests?: string;
}
