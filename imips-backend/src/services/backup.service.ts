import fs from 'fs';
import path from 'path';
import { getDB } from '../utils/db';
import { InventoryService } from './inventory.service';
import { UsersService } from './users.service';
import { OrdersService } from './orders.service';
import { EmailsService } from './emails.service';
import { InquiriesService } from './inquiries.service';

export class BackupService {
    static async createBackup(): Promise<string> {
        const backup = await this.getBackup();
        const filename = `backup-${Date.now()}.json`;
        const filepath = path.join(__dirname, '..', 'backups', filename);

        // Ensure backups directory exists
        const backupsDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
        return filename;
    }

    static async getBackup(): Promise<any> {
        const database = getDB();
        const inventory = await InventoryService.getAll();
        const users = await UsersService.getAll();
        const orders = await OrdersService.getAll();
        const emails = await EmailsService.getAll();
        const inquiries = await InquiriesService.getAll();

        return { inventory, users, orders, emails, inquiries };
    }

    static async restoreBackup(filepath: string): Promise<{ success: boolean; message: string }> {
        try {
            const database = getDB();
            const backupJson = fs.readFileSync(filepath, 'utf-8');
            const backup = JSON.parse(backupJson);

            // Clear existing data
            await database.run(`DELETE FROM inventory`);
            await database.run(`DELETE FROM users`);
            await database.run(`DELETE FROM orders`);
            await database.run(`DELETE FROM order_items`);
            await database.run(`DELETE FROM emails`);
            await database.run(`DELETE FROM inquiries`);

            // Restore inventory
            if (backup.inventory) {
                for (const i of backup.inventory) {
                    await database.run(
                        `INSERT INTO inventory (id, name, sku, quantity, threshold, category, price, imageUrl, warrantyPeriod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [i.id, i.name, i.sku, i.quantity, i.threshold, i.category, i.price, i.imageUrl || null, i.warrantyPeriod || null]
                    );
                }
            }

            // Restore users
            if (backup.users) {
                for (const u of backup.users) {
                    await database.run(
                        `INSERT INTO users (id, name, email, role, password, profilePictureUrl) VALUES (?, ?, ?, ?, ?, ?)`,
                        [u.id, u.name, u.email, u.role, u.password || '', u.profilePictureUrl || null]
                    );
                }
            }

            // Restore orders
            if (backup.orders) {
                for (const o of backup.orders) {
                    await database.run(
                        `INSERT INTO orders (id, customerName, customerContact, customerAddress, customerEmail, subtotal, discountAmount, total, createdAt, createdBy, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [o.id, o.customerName, o.customerContact, o.customerAddress, o.customerEmail, o.subtotal, o.discountAmount || 0, o.total, o.createdAt, o.createdBy, o.status]
                    );

                    if (o.items) {
                        for (const item of o.items) {
                            await database.run(
                                `INSERT INTO order_items (orderId, itemId, name, price, quantity) VALUES (?, ?, ?, ?, ?)`,
                                [o.id, item.id, item.name, item.price, item.cartQuantity]
                            );
                        }
                    }
                }
            }

            // Restore emails
            if (backup.emails) {
                for (const e of backup.emails) {
                    await database.run(
                        `INSERT INTO emails (id, recipient, subject, body, sentAt, attachmentName, attachmentData) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [e.id, e.recipient, e.subject, e.body, e.sentAt, e.attachment?.name || null, e.attachment?.data || null]
                    );
                }
            }

            // Restore inquiries
            if (backup.inquiries) {
                for (const iq of backup.inquiries) {
                    await database.run(
                        `INSERT INTO inquiries (id, customerName, customerEmail, inquiryDetails, status, assignedStaffId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [iq.id, iq.customerName, iq.customerEmail, iq.inquiryDetails, iq.status, iq.assignedStaffId || null, iq.createdAt]
                    );
                }
            }

            return { success: true, message: 'Backup restored successfully' };
        } catch (err: any) {
            console.error('Restore error:', err);
            return { success: false, message: err.message };
        }
    }
}