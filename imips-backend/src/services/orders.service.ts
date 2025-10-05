import { getDB } from '../utils/db';
import { Order, CartItem, OrderStatus } from '../types';
import { InventoryService } from './inventory.service';
import { v4 as uuidv4 } from 'uuid';

export class OrdersService {
    static async createOrder(
        customer: { name: string; contact: string; address: string; email: string },
        cart: CartItem[],
        discount: number | null,
        createdBy: string
    ): Promise<Order> {
        const database = getDB();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
        const discountAmount = discount ? (subtotal * discount) / 100 : 0;
        const total = subtotal - discountAmount;

        const id = uuidv4();
        const order: Order = {
            id,
            customerName: customer.name,
            customerContact: customer.contact,
            customerAddress: customer.address,
            customerEmail: customer.email,
            items: cart,
            subtotal,
            discountApplied: discount || 0,
            total,
            createdAt: new Date().toISOString(),
            createdBy,
            status: OrderStatus.Processing,
        };

        // Insert order
        await database.run(
            `INSERT INTO orders (id, customerName, customerContact, customerAddress, customerEmail, subtotal, discountAmount, total, createdAt, createdBy, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order.id,
                order.customerName,
                order.customerContact,
                order.customerAddress,
                order.customerEmail,
                order.subtotal,
                discountAmount,
                order.total,
                order.createdAt,
                order.createdBy,
                order.status
            ]
        );

        // Insert items
        for (const item of cart) {
            await database.run(
                `INSERT INTO order_items (orderId, itemId, name, price, quantity) VALUES (?, ?, ?, ?, ?)`,
                [order.id, item.id, item.name, item.price, item.cartQuantity]
            );
            // Update inventory
            await InventoryService.reduceStock(item.id, item.cartQuantity);
        }

        return order;
    }

    static async getAll(): Promise<Order[]> {
        const database = getDB();
        const orders = await database.all(`SELECT * FROM orders ORDER BY createdAt DESC`);
        const results: Order[] = [];

        for (const o of orders) {
            const items = await database.all(`SELECT * FROM order_items WHERE orderId = ?`, [o.id]);
            results.push({
                ...o,
                items: items.map((i: any) => ({
                    id: i.itemId,
                    name: i.name,
                    price: i.price,
                    cartQuantity: i.quantity,
                    sku: '',
                    quantity: 0,
                    threshold: 0,
                    category: ''
                })),
                discountApplied: 0,
            });
        }
        return results;
    }

    static async getById(id: string): Promise<Order | null> {
        const database = getDB();
        const order = await database.get(`SELECT * FROM orders WHERE id = ?`, [id]);
        if (!order) return null;

        const items = await database.all(`SELECT * FROM order_items WHERE orderId = ?`, [id]);
        return {
            ...order,
            items: items.map((i: any) => ({
                id: i.itemId,
                name: i.name,
                price: i.price,
                cartQuantity: i.quantity,
                sku: '',
                quantity: 0,
                threshold: 0,
                category: ''
            })),
            discountApplied: 0
        };
    }

    static async updateStatus(id: string, status: OrderStatus): Promise<Order[]> {
        const database = getDB();
        await database.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
        return this.getAll();
    }
}