import { getDB } from '../utils/db';
import { Discount, DiscountType, DiscountCondition } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DiscountsService {
    static async getAll(): Promise<Discount[]> {
        const database = getDB();
        const discounts = await database.all<Discount[]>('SELECT * FROM discounts WHERE isActive = 1 ORDER BY createdAt DESC');
        return discounts || [];
    }

    static async getById(id: string): Promise<Discount | null> {
        const database = getDB();
        const discount = await database.get<Discount>('SELECT * FROM discounts WHERE id = ?', [id]);
        return discount || null;
    }

    static async getByCode(code: string): Promise<Discount | null> {
        const database = getDB();
        const discount = await database.get<Discount>('SELECT * FROM discounts WHERE code = ? AND isActive = 1', [code]);
        return discount || null;
    }

    static async create(discount: Omit<Discount, 'id' | 'createdAt' | 'usedCount'>): Promise<Discount> {
        const database = getDB();

        // Check if discount code already exists
        const existingDiscount = await this.getByCode(discount.code);
        if (existingDiscount) {
            throw new Error('Discount code already exists');
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await database.run(
            `INSERT INTO discounts (id, code, description, type, value, condition, isActive, usedCount, createdAt, createdBy) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                discount.code,
                discount.description,
                discount.type,
                discount.value,
                JSON.stringify(discount.condition),
                discount.isActive ? 1 : 0,
                0, // initial usedCount
                createdAt,
                discount.createdBy
            ]
        );

        const createdDiscount = await this.getById(id);
        if (!createdDiscount) {
            throw new Error('Failed to create discount');
        }
        return createdDiscount;
    }

    static async update(id: string, data: Partial<Discount>): Promise<Discount> {
        const database = getDB();

        const existingDiscount = await this.getById(id);
        if (!existingDiscount) {
            throw new Error('Discount not found');
        }

        // If code is being updated, check for duplicates
        if (data.code && data.code !== existingDiscount.code) {
            const codeExists = await this.getByCode(data.code);
            if (codeExists) {
                throw new Error('Discount code already exists');
            }
        }

        const fields = Object.keys(data)
            .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'usedCount')
            .map(key => {
                if (key === 'condition') return 'condition = ?';
                if (key === 'isActive') return 'isActive = ?';
                return `${key} = ?`;
            })
            .join(', ');

        const values = Object.entries(data)
            .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'usedCount')
            .map(([key, value]) => {
                if (key === 'condition') return JSON.stringify(value);
                if (key === 'isActive') return value ? 1 : 0;
                return value;
            });

        await database.run(
            `UPDATE discounts SET ${fields} WHERE id = ?`,
            [...values, id]
        );

        const updatedDiscount = await this.getById(id);
        if (!updatedDiscount) {
            throw new Error('Failed to update discount');
        }
        return updatedDiscount;
    }

    static async delete(id: string): Promise<void> {
        const database = getDB();
        await database.run('DELETE FROM discounts WHERE id = ?', [id]);
    }

    static async deactivate(id: string): Promise<Discount> {
        const database = getDB();
        await database.run('UPDATE discounts SET isActive = 0 WHERE id = ?', [id]);

        const deactivatedDiscount = await this.getById(id);
        if (!deactivatedDiscount) {
            throw new Error('Failed to deactivate discount');
        }
        return deactivatedDiscount;
    }

    static async incrementUsage(id: string): Promise<void> {
        const database = getDB();
        await database.run(
            'UPDATE discounts SET usedCount = usedCount + 1 WHERE id = ?',
            [id]
        );
    }

    static async validateDiscount(code: string, cartTotal: number, itemCount: number): Promise<{ isValid: boolean; discount?: Discount; message?: string }> {
        const discount = await this.getByCode(code);

        if (!discount) {
            return { isValid: false, message: 'Invalid discount code' };
        }

        if (!discount.isActive) {
            return { isValid: false, message: 'Discount code is no longer active' };
        }

        const condition = discount.condition;

        // Check minimum spend
        if (condition.minSpend && cartTotal < condition.minSpend) {
            return {
                isValid: false,
                message: `Minimum spend of $${condition.minSpend} required for this discount`
            };
        }

        // Check minimum items
        if (condition.minItems && itemCount < condition.minItems) {
            return {
                isValid: false,
                message: `Minimum ${condition.minItems} items required for this discount`
            };
        }

        // Check expiration
        if (condition.validUntil && new Date(condition.validUntil) < new Date()) {
            return { isValid: false, message: 'Discount code has expired' };
        }

        // Check usage limit
        if (condition.maxUsage && discount.usedCount >= condition.maxUsage) {
            return { isValid: false, message: 'Discount code has reached its usage limit' };
        }

        return { isValid: true, discount };
    }

    static async getActiveDiscounts(): Promise<Discount[]> {
        const database = getDB();
        const discounts = await database.all<Discount[]>('SELECT * FROM discounts WHERE isActive = 1 ORDER BY createdAt DESC');
        return discounts || [];
    }

    static async getDiscountStats() {
        const database = getDB();

        const stats = await database.get<{
            totalDiscounts: number;
            activeDiscounts: number;
            totalUsage: number;
            totalSavings: number;
        }>(`
            SELECT 
                COUNT(*) as totalDiscounts,
                SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeDiscounts,
                SUM(usedCount) as totalUsage
            FROM discounts
        `);

        return stats || { totalDiscounts: 0, activeDiscounts: 0, totalUsage: 0, totalSavings: 0 };
    }
}