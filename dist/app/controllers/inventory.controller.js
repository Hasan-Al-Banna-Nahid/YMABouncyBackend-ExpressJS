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
exports.releaseExpiredCartItemsHandler = exports.checkInventoryAvailabilityHandler = exports.getBookedInventoryHandler = exports.getAvailableInventoryHandler = exports.deleteInventoryItemHandler = exports.updateInventoryItemHandler = exports.getInventoryItemsHandler = exports.getInventoryItemHandler = exports.createInventoryItemHandler = void 0;
const inventory_service_1 = require("../services/inventory.service");
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = require("../utils/apiResponse");
const createInventoryItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventoryItem = yield (0, inventory_service_1.createInventoryItem)(req.body);
        (0, apiResponse_1.ApiResponse)(res, 201, 'Inventory item created successfully', { inventoryItem });
    }
    catch (err) {
        next(err);
    }
});
exports.createInventoryItemHandler = createInventoryItemHandler;
const getInventoryItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventoryItem = yield (0, inventory_service_1.getInventoryItem)(req.params.id);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Inventory item retrieved successfully', { inventoryItem });
    }
    catch (err) {
        next(err);
    }
});
exports.getInventoryItemHandler = getInventoryItemHandler;
const getInventoryItemsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventoryItems = yield (0, inventory_service_1.getInventoryItems)(req.query);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Inventory items retrieved successfully', { inventoryItems });
    }
    catch (err) {
        next(err);
    }
});
exports.getInventoryItemsHandler = getInventoryItemsHandler;
const updateInventoryItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inventoryItem = yield (0, inventory_service_1.updateInventoryItem)(req.params.id, req.body);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Inventory item updated successfully', { inventoryItem });
    }
    catch (err) {
        next(err);
    }
});
exports.updateInventoryItemHandler = updateInventoryItemHandler;
const deleteInventoryItemHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, inventory_service_1.deleteInventoryItem)(req.params.id);
        (0, apiResponse_1.ApiResponse)(res, 204, 'Inventory item deleted successfully');
    }
    catch (err) {
        next(err);
    }
});
exports.deleteInventoryItemHandler = deleteInventoryItemHandler;
const getAvailableInventoryHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, startDate, endDate } = req.query;
        if (!productId || !startDate || !endDate) {
            throw new apiError_1.default('Please provide productId, startDate and endDate query parameters', 400);
        }
        const availableInventory = yield (0, inventory_service_1.getAvailableInventory)(productId, new Date(startDate), new Date(endDate));
        (0, apiResponse_1.ApiResponse)(res, 200, 'Available inventory retrieved successfully', { availableInventory });
    }
    catch (err) {
        next(err);
    }
});
exports.getAvailableInventoryHandler = getAvailableInventoryHandler;
const getBookedInventoryHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, startDate, endDate } = req.query;
        if (!productId || !startDate || !endDate) {
            throw new apiError_1.default('Please provide productId, startDate and endDate query parameters', 400);
        }
        const bookedInventory = yield (0, inventory_service_1.getBookedInventory)(productId, new Date(startDate), new Date(endDate));
        (0, apiResponse_1.ApiResponse)(res, 200, 'Booked inventory retrieved successfully', { bookedInventory });
    }
    catch (err) {
        next(err);
    }
});
exports.getBookedInventoryHandler = getBookedInventoryHandler;
const checkInventoryAvailabilityHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, date } = req.query;
        if (!productId || !date) {
            throw new apiError_1.default('Please provide productId and date query parameters', 400);
        }
        const availability = yield (0, inventory_service_1.checkInventoryAvailability)(productId, new Date(date));
        (0, apiResponse_1.ApiResponse)(res, 200, 'Inventory availability checked successfully', { availability });
    }
    catch (err) {
        next(err);
    }
});
exports.checkInventoryAvailabilityHandler = checkInventoryAvailabilityHandler;
const releaseExpiredCartItemsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield (0, inventory_service_1.releaseExpiredCartItems)();
        (0, apiResponse_1.ApiResponse)(res, 200, 'Expired cart items released successfully', { count });
    }
    catch (err) {
        next(err);
    }
});
exports.releaseExpiredCartItemsHandler = releaseExpiredCartItemsHandler;
