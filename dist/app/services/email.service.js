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
exports.sendInvoice = exports.sendBookingReminder = exports.sendBookingConfirmation = exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ejs_1 = __importDefault(require("ejs"));
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
const loadTemplate = (templateName) => __awaiter(void 0, void 0, void 0, function* () {
    const templatePath = path_1.default.join(__dirname, `../email-templates/${templateName}.ejs`);
    try {
        const template = yield fs_1.default.promises.readFile(templatePath, 'utf-8');
        return template;
    }
    catch (err) {
        throw new apiError_1.default(`Failed to load email template: ${templateName}`, 500);
    }
});
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, subject, template, templateVars, }) {
    if (process.env.NODE_ENV === 'test')
        return;
    try {
        const templateContent = yield loadTemplate(template);
        const html = ejs_1.default.render(templateContent, templateVars);
        const msg = {
            to: email,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: process.env.SENDGRID_FROM_NAME,
            },
            subject,
            html,
        };
        yield mail_1.default.send(msg);
    }
    catch (err) {
        throw new apiError_1.default('There was an error sending the email. Try again later!', 500);
    }
});
exports.sendEmail = sendEmail;
const sendBookingConfirmation = (booking) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.sendEmail)({
        email: booking.user.email,
        subject: 'Your Booking Confirmation',
        template: 'bookingConfirmation',
        templateVars: {
            name: booking.user.name,
            productName: booking.product.name,
            startDate: booking.startDate.toLocaleDateString(),
            endDate: booking.endDate.toLocaleDateString(),
            price: booking.price,
        },
    });
});
exports.sendBookingConfirmation = sendBookingConfirmation;
const sendBookingReminder = (booking) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.sendEmail)({
        email: booking.user.email,
        subject: 'Upcoming Booking Reminder',
        template: 'bookingReminder',
        templateVars: {
            name: booking.user.name,
            productName: booking.product.name,
            startDate: booking.startDate.toLocaleDateString(),
            endDate: booking.endDate.toLocaleDateString(),
        },
    });
});
exports.sendBookingReminder = sendBookingReminder;
const sendInvoice = (invoice) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.sendEmail)({
        email: invoice.user.email,
        subject: `Your Invoice #${invoice.invoiceNumber}`,
        template: 'invoice',
        templateVars: {
            name: invoice.user.name,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate.toLocaleDateString(),
            dueDate: invoice.dueDate.toLocaleDateString(),
            amount: invoice.amount,
            totalAmount: invoice.totalAmount,
            showCashOnDelivery: invoice.showCashOnDelivery,
        },
    });
});
exports.sendInvoice = sendInvoice;
