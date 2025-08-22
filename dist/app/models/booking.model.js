"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bookingSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Booking must belong to a product'] },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: [true, 'Booking must belong to a user'] },
    price: { type: Number, required: [true, 'Booking must have a price'] },
    paid: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    startDate: { type: Date, required: [true, 'Booking must have a start date'] },
    endDate: { type: Date, required: [true, 'Booking must have an end date'] },
    deliveryAddress: { type: String, required: [true, 'Booking must have a delivery address'] },
    deliveryTime: { type: String, required: [true, 'Booking must have a delivery time'] },
    specialRequests: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
bookingSchema.index({ product: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
// Auto-populate product & user (include _id explicitly to be safe)
bookingSchema.pre(/^find/, function (next) {
    this.populate('product').populate({
        path: 'user',
        select: '_id name email photo',
    });
    next();
});
const Booking = mongoose_1.default.model('Booking', bookingSchema);
exports.default = Booking;
