import sgMail from '@sendgrid/mail';
import ApiError from '../utils/apiError';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const loadTemplate = async (templateName: string) => {
    const templatePath = path.join(__dirname, `../email-templates/${templateName}.ejs`);
    try {
        const template = await fs.promises.readFile(templatePath, 'utf-8');
        return template;
    } catch (err) {
        throw new ApiError(`Failed to load email template: ${templateName}`, 500);
    }
};

export const sendEmail = async ({
                                    email,
                                    subject,
                                    template,
                                    templateVars,
                                }: {
    email: string;
    subject: string;
    template: string;
    templateVars: any;
}) => {
    if (process.env.NODE_ENV === 'test') return;

    try {
        const templateContent = await loadTemplate(template);
        const html = ejs.render(templateContent, templateVars);

        const msg = {
            to: email,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL!,
                name: process.env.SENDGRID_FROM_NAME!,
            },
            subject,
            html,
        };

        await sgMail.send(msg);
    } catch (err) {
        throw new ApiError('There was an error sending the email. Try again later!', 500);
    }
};

export const sendBookingConfirmation = async (booking: any) => {
    await sendEmail({
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
};

export const sendBookingReminder = async (booking: any) => {
    await sendEmail({
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
};

export const sendInvoice = async (invoice: any) => {
    await sendEmail({
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
};