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
exports.generateCustomInvoice = exports.generateInvoiceForBooking = exports.deleteInvoice = exports.updateInvoice = exports.getInvoicesByBooking = exports.getInvoicesByUser = exports.getInvoices = exports.getInvoice = exports.createInvoice = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const booking_model_1 = __importDefault(require("../models/booking.model"));
const email_service_1 = require("./email.service");
const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${year}${month}${randomNum}`;
};
const createInvoice = (invoiceData) => __awaiter(void 0, void 0, void 0, function* () {
    // If a booking is provided, validate it exists
    if (invoiceData.booking) {
        const exists = yield booking_model_1.default.exists({ _id: invoiceData.booking });
        if (!exists)
            throw new apiError_1.default('No booking found with that ID', 404);
    }
    const invoiceNumber = generateInvoiceNumber();
    const created = yield invoice_model_1.default.create(Object.assign(Object.assign({}, invoiceData), { invoiceNumber }));
    // Populate user for email fields
    const populated = yield created.populate({
        path: 'user',
        select: 'name email',
    });
    const user = populated.user;
    if (!(user === null || user === void 0 ? void 0 : user.email)) {
        // If your system allows users without email, skip sending
        return populated;
    }
    yield (0, email_service_1.sendEmail)({
        email: user.email,
        subject: `Your Invoice #${invoiceNumber}`,
        template: 'invoiceCreated',
        templateVars: {
            name: user.name,
            invoiceNumber: populated.invoiceNumber,
            issueDate: populated.issueDate.toLocaleDateString(),
            dueDate: populated.dueDate.toLocaleDateString(),
            amount: populated.amount,
            totalAmount: populated.totalAmount,
        },
    });
    return populated;
});
exports.createInvoice = createInvoice;
const getInvoice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const invoice = yield invoice_model_1.default.findById(id);
    if (!invoice) {
        throw new apiError_1.default('No invoice found with that ID', 404);
    }
    return invoice;
});
exports.getInvoice = getInvoice;
const getInvoices = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filter = {}) {
    return yield invoice_model_1.default.find(filter);
});
exports.getInvoices = getInvoices;
const getInvoicesByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield invoice_model_1.default.find({ user: userId });
});
exports.getInvoicesByUser = getInvoicesByUser;
const getInvoicesByBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield invoice_model_1.default.find({ booking: bookingId });
});
exports.getInvoicesByBooking = getInvoicesByBooking;
const updateInvoice = (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const invoice = yield invoice_model_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!invoice) {
        throw new apiError_1.default('No invoice found with that ID', 404);
    }
    // If status updated to paid, send payment confirmation email
    if (updateData.status === 'paid') {
        const populated = yield invoice.populate({
            path: 'user',
            select: 'name email',
        });
        const user = populated.user;
        if (user === null || user === void 0 ? void 0 : user.email) {
            yield (0, email_service_1.sendEmail)({
                email: user.email,
                subject: `Payment Received for Invoice #${populated.invoiceNumber}`,
                template: 'invoicePaid',
                templateVars: {
                    name: user.name,
                    invoiceNumber: populated.invoiceNumber,
                    paymentDate: new Date().toLocaleDateString(),
                    amount: populated.amount,
                },
            });
        }
    }
    return invoice;
});
exports.updateInvoice = updateInvoice;
const deleteInvoice = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const invoice = yield invoice_model_1.default.findByIdAndDelete(id);
    if (!invoice) {
        throw new apiError_1.default('No invoice found with that ID', 404);
    }
    return invoice;
});
exports.deleteInvoice = deleteInvoice;
const generateInvoiceForBooking = (bookingId_1, ...args_1) => __awaiter(void 0, [bookingId_1, ...args_1], void 0, function* (bookingId, isOrganization = false) {
    const booking = yield booking_model_1.default.findById(bookingId).populate('user').populate('product');
    if (!booking) {
        throw new apiError_1.default('No booking found with that ID', 404);
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    const invoiceData = {
        booking: bookingId,
        user: booking.user._id, // ObjectId
        issueDate: new Date(),
        dueDate,
        amount: booking.price,
        tax: 0,
        discount: 0,
        totalAmount: booking.price,
        status: 'sent',
        paymentMethod: 'cash',
        isOrganization,
        showCashOnDelivery: !isOrganization,
    };
    return yield (0, exports.createInvoice)(invoiceData);
});
exports.generateInvoiceForBooking = generateInvoiceForBooking;
const generateCustomInvoice = (userId, amount, description, isOrganization) => __awaiter(void 0, void 0, void 0, function* () {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    const invoiceData = {
        user: userId, // string OK
        issueDate: new Date(),
        dueDate,
        amount,
        tax: 0,
        discount: 0,
        totalAmount: amount,
        status: 'sent',
        paymentMethod: 'bank-transfer',
        notes: description,
        isOrganization,
        showCashOnDelivery: !isOrganization,
        // no booking for custom invoices
    };
    return yield (0, exports.createInvoice)(invoiceData);
});
exports.generateCustomInvoice = generateCustomInvoice;
