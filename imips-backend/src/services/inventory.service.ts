import { getDB } from '../utils/db';
import { InventoryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ImageUtils } from '../utils/imageUtils'; // Add this import

export class InventoryService {
    static async getAll() {
        const database = getDB();
        const items = await database.all<InventoryItem[]>('SELECT * FROM inventory ORDER BY name');

        // Process items to ensure image URLs with fallbacks
        return Promise.all(
            items.map(async (item) => ({
                ...item,
                imageUrl: await ImageUtils.processImageUrl(item.imageUrl, 'inventory')
            }))
        );
    }

    static async add(item: Partial<InventoryItem>) {
        const database = getDB();

        if (!item.name || !item.sku) {
            throw new Error('Name and SKU are required');
        }

        const existingItem = await database.get<InventoryItem>(
            'SELECT id FROM inventory WHERE sku = ?',
            [item.sku]
        );

        if (existingItem) {
            throw new Error('An item with this SKU already exists');
        }

        const id = uuidv4();

        // Process image URL before saving
        const imageUrl = ImageUtils.processImageUrl(item.imageUrl, 'inventory');

        await database.run(
            'INSERT INTO inventory (id, name, sku, quantity, threshold, category, price, imageUrl, warrantyPeriod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                item.name || '',
                item.sku || '',
                item.quantity || 0,
                item.threshold || 0,
                item.category || '',
                item.price || 0,
                imageUrl,
                item.warrantyPeriod || null
            ]
        );

        return {
            id,
            ...item,
            imageUrl
        };
    }

    static async update(data: Partial<InventoryItem> & { id: string }) {
        const database = getDB();
        const { id, ...updateData } = data;

        const existingItem = await this.getById(id);
        if (!existingItem) {
            throw new Error('Inventory item not found');
        }

        if (updateData.sku && updateData.sku !== existingItem.sku) {
            const skuExists = await database.get<InventoryItem>(
                'SELECT id FROM inventory WHERE sku = ? AND id != ?',
                [updateData.sku, id]
            );

            if (skuExists) {
                throw new Error('Another item with this SKU already exists');
            }
        }

        // Process image URL - if not provided in update, keep existing one
        if (!updateData.imageUrl) {
            updateData.imageUrl = existingItem.imageUrl;
        } else {
            updateData.imageUrl = ImageUtils.processImageUrl(updateData.imageUrl, 'inventory');
        }

        const fields = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updateData);

        await database.run(
            `UPDATE inventory SET ${fields} WHERE id=?`,
            [...values, id]
        );

        return this.getById(id);
    }

    static async getById(id: string) {
        const database = getDB();
        const item = await database.get<InventoryItem>('SELECT * FROM inventory WHERE id=?', [id]);

        if (item) {
            return {
                ...item,
                imageUrl: ImageUtils.processImageUrl(item.imageUrl, 'inventory')
            };
        }
        return null;
    }

    static async delete(id: string) {
        const database = getDB();

        // Check if item exists
        const existingItem = await this.getById(id);
        if (!existingItem) {
            throw new Error('Inventory item not found');
        }

        // Check if item is used in any orders
        const orderUsage = await database.get<{ count: number }>(
            'SELECT COUNT(*) as count FROM order_items WHERE itemId = ?',
            [id]
        );

        if (orderUsage && orderUsage.count > 0) {
            throw new Error('Cannot delete item that is used in existing orders');
        }

        await database.run('DELETE FROM inventory WHERE id=?', [id]);

        return { message: 'Inventory item deleted successfully' };
    }

    static async reduceStock(id: string, quantity: number) {
        const database = getDB();

        // Check current stock
        const item = await this.getById(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }

        if (item.quantity < quantity) {
            throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}`);
        }

        await database.run(
            'UPDATE inventory SET quantity = quantity - ? WHERE id=?',
            [quantity, id]
        );

        // Check if stock is below threshold after reduction
        const updatedItem = await this.getById(id);
        if (updatedItem && updatedItem.quantity <= updatedItem.threshold) {
            console.warn(`⚠️ Low stock alert: ${updatedItem.name} (SKU: ${updatedItem.sku}) - Quantity: ${updatedItem.quantity}, Threshold: ${updatedItem.threshold}`);
        }

        return this.getById(id);
    }

    static async increaseStock(id: string, quantity: number) {
        const database = getDB();

        // Check if item exists
        const item = await this.getById(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }

        await database.run(
            'UPDATE inventory SET quantity = quantity + ? WHERE id=?',
            [quantity, id]
        );

        return this.getById(id);
    }

    static async getLowStock() {
        const database = getDB();
        const items = await database.all<InventoryItem[]>(
            'SELECT * FROM inventory WHERE quantity <= threshold ORDER BY quantity ASC'
        );

        // Process items to ensure image URLs with fallbacks
        return Promise.all(
            items.map(async (item) => ({
                ...item,
                imageUrl: await ImageUtils.processImageUrl(item.imageUrl, 'inventory')
            }))
        );
    }

    static async getByCategory(category: string) {
        const database = getDB();
        const items = await database.all<InventoryItem[]>(
            'SELECT * FROM inventory WHERE category = ? ORDER BY name',
            [category]
        );

        // Process items to ensure image URLs with fallbacks
        return Promise.all(
            items.map(async (item) => ({
                ...item,
                imageUrl: await ImageUtils.processImageUrl(item.imageUrl, 'inventory')
            }))
        );
    }

    static async search(query: string) {
        const database = getDB();
        const items = await database.all<InventoryItem[]>(
            `SELECT * FROM inventory 
             WHERE name LIKE ? OR sku LIKE ? OR category LIKE ?
             ORDER BY name`,
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );

        // Process items to ensure image URLs with fallbacks
        return Promise.all(
            items.map(async (item) => ({
                ...item,
                imageUrl: await ImageUtils.processImageUrl(item.imageUrl, 'inventory')
            }))
        );
    }

    static async getCategories() {
        const database = getDB();
        const categories = await database.all<{ category: string }[]>(
            'SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL AND category != "" ORDER BY category'
        );

        return categories.map(c => c.category);
    }

    static async getStockSummary() {
        const database = getDB();

        const summary = await database.get<{
            totalItems: number,
            totalValue: number,
            lowStockItems: number,
            outOfStockItems: number
        }>(`
            SELECT 
                COUNT(*) as totalItems,
                SUM(quantity * price) as totalValue,
                SUM(CASE WHEN quantity <= threshold THEN 1 ELSE 0 END) as lowStockItems,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockItems
            FROM inventory
        `);

        return summary || { totalItems: 0, totalValue: 0, lowStockItems: 0, outOfStockItems: 0 };
    }

    static async bulkUpdateQuantities(updates: Array<{ id: string; quantity: number }>) {
        const database = getDB();

        try {
            await database.run('BEGIN TRANSACTION');

            for (const update of updates) {
                await database.run(
                    'UPDATE inventory SET quantity = ? WHERE id = ?',
                    [update.quantity, update.id]
                );
            }

            await database.run('COMMIT');

            return { message: 'Bulk update completed successfully' };
        } catch (error) {
            await database.run('ROLLBACK');
            throw new Error('Bulk update failed: ' + (error as Error).message);
        }
    }

    /**
     * Check if SKU is available
     */
    static async isSkuAvailable(sku: string, excludeItemId?: string): Promise<boolean> {
        const database = getDB();

        let query = 'SELECT COUNT(*) as count FROM inventory WHERE sku = ?';
        const params: any[] = [sku];

        if (excludeItemId) {
            query += ' AND id != ?';
            params.push(excludeItemId);
        }

        const result = await database.get<{ count: number }>(query, params);
        return result ? result.count === 0 : true;
    }
}