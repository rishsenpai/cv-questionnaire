import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return cachedTransporter;
}
