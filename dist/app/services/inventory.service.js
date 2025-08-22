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
exports.releaseExpiredCartItems = exports.checkInventoryAvailability = exports.getBookedInventory = exports.getAvailableInventory = exports.deleteInventoryItem = exports.updateInventoryItem = exports.getInventoryItems = exports.getInventoryItem = exports.createInventoryItem = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const inventory_model_1 = __importDefault(require("../models/inventory.model"));
const booking_model_1 = __importDefault(require("../models/booking.model")); // <-- add this
const mongoose_1 = require("mongoose");
// Helper: normalize product to ObjectId (handles populated docs and strings)
const toObjectId = (val) => {
    if (val instanceof mongoose_1.Types.ObjectId)
        return val;
    if (val && val._id instanceof mongoose_1.Types.ObjectId)
        return val._id;
    return new mongoose_1.Types.ObjectId(String(val));
};
const createInventoryItem = (inventoryData) => __awaiter(void 0, void 0, void 0, function* () {
    const existingItem = yield inventory_model_1.default.findOne({
        product: inventoryData.product,
        date: inventoryData.date,
    });
    if (existingItem) {
        throw new apiError_1.default('Inventory item already exists for this product and date', 400);
    }
    const inventoryItem = yield inventory_model_1.default.create(inventoryData);
    return inventoryItem;
});
exports.createInventoryItem = createInventoryItem;
const getInventoryItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const inventoryItem = yield inventory_model_1.default.findById(id);
    if (!inventoryItem) {
        throw new apiError_1.default('No inventory item found with that ID', 404);
    }
    return inventoryItem;
});
exports.getInventoryItem = getInventoryItem;
const getInventoryItems = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    return yield inventory_model_1.default.find(filter);
});
exports.getInventoryItems = getInventoryItems;
const updateInventoryItem = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const inventoryItem = yield inventory_model_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!inventoryItem) {
        throw new apiError_1.default('No inventory item found with that ID', 404);
    }
    return inventoryItem;
});
exports.updateInventoryItem = updateInventoryItem;
const deleteInventoryItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const inventoryItem = yield inventory_model_1.default.findByIdAndDelete(id);
    if (!inventoryItem) {
        throw new apiError_1.default('No inventory item found with that ID', 404);
    }
    return inventoryItem;
});
exports.deleteInventoryItem = deleteInventoryItem;
const getAvailableInventory = (productId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return yield inventory_model_1.default.find({
        product: productId,
        date: { $gte: startDate, $lte: endDate },
        status: 'available',
    });
});
exports.getAvailableInventory = getAvailableInventory;
const getBookedInventory = (productId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return yield inventory_model_1.default.find({
        product: productId,
        date: { $gte: startDate, $lte: endDate },
        status: 'booked',
    });
});
exports.getBookedInventory = getBookedInventory;
const checkInventoryAvailability = (productId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const inventoryItem = yield inventory_model_1.default.findOne({
        product: productId,
        date,
    });
    if (!inventoryItem) {
        return { available: false, quantity: 0 };
    }
    return {
        available: inventoryItem.status === 'available',
        quantity: inventoryItem.quantity,
    };
});
exports.checkInventoryAvailability = checkInventoryAvailability;
const releaseExpiredCartItems = () => __awaiter(void 0, void 0, void 0, function* () {
    // Bookings pending for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    // Keep payload light; avoid populating heavy fields
    const expiredBookings = yield booking_model_1.default.find({
        status: 'pending',
        createdAt: { $lte: thirtyMinutesAgo },
    }).select('_id product startDate endDate createdAt status');
    for (const booking of expiredBookings) {
        const productId = toObjectId(booking.product);
        // Return inventory to 'available' and detach this booking reference (if your schema has one)
        yield inventory_model_1.default.updateMany({
            product: productId,
            date: { $gte: booking.startDate, $lte: booking.endDate },
        }, {
            $set: { status: 'available' },
            $pull: { bookings: booking._id }, // harmless if 'bookings' field doesn't exist
        });
        // Delete the expired booking
        yield booking_model_1.default.findByIdAndDelete(booking._id);
    }
    return expiredBookings.length;
});
exports.releaseExpiredCartItems = releaseExpiredCartItems;
