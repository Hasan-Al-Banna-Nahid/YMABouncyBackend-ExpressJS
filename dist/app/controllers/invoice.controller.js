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
exports.generateCustomInvoiceHandler = exports.generateInvoiceForBookingHandler = exports.deleteInvoiceHandler = exports.updateInvoiceHandler = exports.getInvoicesByBookingHandler = exports.getInvoicesHandler = exports.getInvoiceHandler = exports.createInvoiceHandler = void 0;
const mongoose_1 = require("mongoose");
const invoice_service_1 = require("../services/invoice.service");
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = require("../utils/apiResponse");
// Safely extract the owner id whether invoice.user is ObjectId or populated doc
function ownerId(user) {
    return (user instanceof mongoose_1.Types.ObjectId ? user : user._id).toString();
}
/** POST /invoices */
const createInvoiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoiceData = Object.assign(Object.assign({}, aReq.body), { user: aReq.user.id });
        const invoice = yield (0, invoice_service_1.createInvoice)(invoiceData);
        (0, apiResponse_1.ApiResponse)(res, 201, 'Invoice created successfully', { invoice });
    }
    catch (err) {
        next(err);
    }
});
exports.createInvoiceHandler = createInvoiceHandler;
/** GET /invoices/:id */
const getInvoiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoice = yield (0, invoice_service_1.getInvoice)(req.params.id);
        // Allow owner or admin
        if (ownerId(invoice.user) !== aReq.user.id && aReq.user.role !== 'admin') {
            throw new apiError_1.default('You are not authorized to view this invoice', 403);
        }
        (0, apiResponse_1.ApiResponse)(res, 200, 'Invoice retrieved successfully', { invoice });
    }
    catch (err) {
        next(err);
    }
});
exports.getInvoiceHandler = getInvoiceHandler;
/** GET /invoices */
const getInvoicesHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoices = aReq.user.role === 'admin' ? yield (0, invoice_service_1.getInvoices)() : yield (0, invoice_service_1.getInvoicesByUser)(aReq.user.id);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Invoices retrieved successfully', { invoices });
    }
    catch (err) {
        next(err);
    }
});
exports.getInvoicesHandler = getInvoicesHandler;
/** GET /invoices/booking/:bookingId */
const getInvoicesByBookingHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoices = yield (0, invoice_service_1.getInvoicesByBooking)(req.params.bookingId);
        if (invoices.length > 0 &&
            ownerId(invoices[0].user) !== aReq.user.id &&
            aReq.user.role !== 'admin') {
            throw new apiError_1.default('You are not authorized to view these invoices', 403);
        }
        (0, apiResponse_1.ApiResponse)(res, 200, 'Invoices retrieved successfully', { invoices });
    }
    catch (err) {
        next(err);
    }
});
exports.getInvoicesByBookingHandler = getInvoicesByBookingHandler;
/** PATCH /invoices/:id */
const updateInvoiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoice = yield (0, invoice_service_1.getInvoice)(req.params.id);
        if (ownerId(invoice.user) !== aReq.user.id && aReq.user.role !== 'admin') {
            throw new apiError_1.default('You are not authorized to update this invoice', 403);
        }
        const updatedInvoice = yield (0, invoice_service_1.updateInvoice)(req.params.id, req.body);
        (0, apiResponse_1.ApiResponse)(res, 200, 'Invoice updated successfully', { invoice: updatedInvoice });
    }
    catch (err) {
        next(err);
    }
});
exports.updateInvoiceHandler = updateInvoiceHandler;
/** DELETE /invoices/:id */
const deleteInvoiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const invoice = yield (0, invoice_service_1.getInvoice)(req.params.id);
        if (ownerId(invoice.user) !== aReq.user.id && aReq.user.role !== 'admin') {
            throw new apiError_1.default('You are not authorized to delete this invoice', 403);
        }
        yield (0, invoice_service_1.deleteInvoice)(req.params.id);
        (0, apiResponse_1.ApiResponse)(res, 204, 'Invoice deleted successfully');
    }
    catch (err) {
        next(err);
    }
});
exports.deleteInvoiceHandler = deleteInvoiceHandler;
/** POST /invoices/generate/:bookingId */
const generateInvoiceForBookingHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { isOrganization } = req.body;
        const invoice = yield (0, invoice_service_1.generateInvoiceForBooking)(req.params.bookingId, isOrganization);
        (0, apiResponse_1.ApiResponse)(res, 201, 'Invoice generated successfully', { invoice });
    }
    catch (err) {
        next(err);
    }
});
exports.generateInvoiceForBookingHandler = generateInvoiceForBookingHandler;
/** POST /invoices/custom */
const generateCustomInvoiceHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aReq = req;
        if (!aReq.user)
            throw new apiError_1.default('User not found', 404);
        const { amount, description, isOrganization } = aReq.body;
        const invoice = yield (0, invoice_service_1.generateCustomInvoice)(aReq.user.id, amount, description, isOrganization);
        (0, apiResponse_1.ApiResponse)(res, 201, 'Custom invoice generated successfully', { invoice });
    }
    catch (err) {
        next(err);
    }
});
exports.generateCustomInvoiceHandler = generateCustomInvoiceHandler;
