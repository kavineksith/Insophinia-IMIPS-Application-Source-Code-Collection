import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { getDB } from '../utils/db';
import { Email, Attachment } from '../types';

interface SendEmailOptions {
    recipient: string;
    subject: string;
    body: string;
    attachment?: {
        filename: string;
        path: string;
    };
}

export class EmailsService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    static async sendEmail({ recipient, subject, body, attachment }: SendEmailOptions): Promise<Email> {
        const mailOptions: any = {
            from: process.env.GMAIL_USER,
            to: recipient,
            subject,
            html: body,
        };

        if (attachment) {
            mailOptions.attachments = [
                {
                    filename: attachment.filename,
                    path: attachment.path,
                },
            ];
        }

        await this.transporter.sendMail(mailOptions);

        const id = `${Date.now()}`;
        const sentEmail: Email = {
            id,
            recipient,
            subject,
            body,
            sentAt: new Date().toISOString(),
            attachment: attachment
                ? {
                    name: attachment.filename,
                    type: path.extname(attachment.filename).substring(1),
                    size: fs.statSync(attachment.path).size,
                    data: fs.readFileSync(attachment.path, { encoding: 'base64' }),
                }
                : undefined,
        };

        // Store in SQLite
        getDB().run(
            `INSERT INTO emails (id, recipient, subject, body, sentAt, attachmentName, attachmentData) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sentEmail.id,
            sentEmail.recipient,
            sentEmail.subject,
            sentEmail.body,
            sentEmail.sentAt,
            sentEmail.attachment?.name || null,
            sentEmail.attachment?.data || null
        );

        return sentEmail;
    }

    static async getAll(): Promise<Email[]> {
        const database = getDB(); // Get database instance
        const rows = await database.all(`SELECT * FROM emails ORDER BY sentAt DESC`); // Add await here

        return rows.map((r: any) => ({
            id: r.id,
            recipient: r.recipient,
            subject: r.subject,
            body: r.body,
            sentAt: r.sentAt,
            attachment: r.attachmentName
                ? {
                    name: r.attachmentName,
                    type: path.extname(r.attachmentName).substring(1),
                    size: r.attachmentData ? Buffer.from(r.attachmentData, 'base64').length : 0,
                    data: r.attachmentData,
                }
                : undefined,
        }));
    }
}
