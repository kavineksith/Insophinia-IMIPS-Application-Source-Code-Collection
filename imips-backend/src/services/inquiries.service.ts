import { getDB } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { CustomerInquiry, InquiryStatus } from '../types';

export class InquiriesService {
    static async getAll() {
        const database = getDB();
        return database.all<CustomerInquiry[]>('SELECT * FROM inquiries ORDER BY createdAt DESC');
    }

    static async add(inquiry: Omit<CustomerInquiry, 'id' | 'createdAt'>) {
        const database = getDB();
        const id = uuidv4();
        const createdAt = new Date().toISOString();
        await database.run(
            'INSERT INTO inquiries (id, customerName, customerEmail, inquiryDetails, status, assignedStaffId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, inquiry.customerName, inquiry.customerEmail, inquiry.inquiryDetails, InquiryStatus.Pending, inquiry.assignedStaffId, createdAt]
        );
        return { ...inquiry, id, createdAt, status: InquiryStatus.Pending };
    }

    static async update(inquiry: CustomerInquiry) {
        const database = getDB();
        await database.run(
            'UPDATE inquiries SET customerName=?, customerEmail=?, inquiryDetails=?, status=?, assignedStaffId=? WHERE id=?',
            [inquiry.customerName, inquiry.customerEmail, inquiry.inquiryDetails, inquiry.status, inquiry.assignedStaffId, inquiry.id]
        );
        return this.getAll();
    }

    static async delete(id: string) {
        const database = getDB();
        await database.run('DELETE FROM inquiries WHERE id = ?', [id]);
    }
}
