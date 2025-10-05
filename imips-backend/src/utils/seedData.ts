import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface UserData {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    profilePictureUrl?: string;
}

export interface InventoryData {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
    category: string;
    price: number;
    imageUrl?: string;
    warrantyPeriod?: number;
}

class DatabaseSeeder {
    /**
     * Create default admin user if it doesn't exist
     */
    static async createDefaultAdmin(database: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
        try {
            const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@imips.com';
            const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

            // Check if admin user already exists
            const existingAdmin = await database.get(
                'SELECT id FROM users WHERE email = ? AND role = ?',
                [adminEmail, 'Admin']
            );

            if (!existingAdmin) {
                const adminId = uuidv4();
                const hashedPassword = await bcrypt.hash(adminPassword, 10);

                await database.run(
                    `INSERT INTO users (id, name, email, password, role, profilePictureUrl) 
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [adminId, 'System Administrator', adminEmail, hashedPassword, 'Admin', null]
                );

                console.log('✅ Default admin user created:');
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
                console.log('   Please change the password after first login!');
            } else {
                console.log('✅ Admin user already exists');
            }
        } catch (error) {
            console.error('❌ Failed to create default admin user:', error);
            throw error;
        }
    }

    /**
     * Seed multiple default users (Admin, Manager, Staff)
     */
    static async seedDefaultUsers(database: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
        try {
            const defaultUsers: UserData[] = [
                {
                    id: uuidv4(),
                    name: 'System Administrator',
                    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@imips.com',
                    password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10),
                    role: 'Admin'
                },
                {
                    id: uuidv4(),
                    name: 'Inventory Manager',
                    email: 'manager@imips.com',
                    password: await bcrypt.hash('manager123', 10),
                    role: 'Manager'
                },
                {
                    id: uuidv4(),
                    name: 'Sales Staff',
                    email: 'staff@imips.com',
                    password: await bcrypt.hash('staff123', 10),
                    role: 'Staff'
                },
                {
                    id: uuidv4(),
                    name: 'Support Staff',
                    email: 'support@imips.com',
                    password: await bcrypt.hash('support123', 10),
                    role: 'Staff'
                }
            ];

            let createdCount = 0;

            for (const user of defaultUsers) {
                // Check if user already exists
                const existingUser = await database.get(
                    'SELECT id FROM users WHERE email = ?',
                    [user.email]
                );

                if (!existingUser) {
                    await database.run(
                        `INSERT INTO users (id, name, email, password, role, profilePictureUrl) 
             VALUES (?, ?, ?, ?, ?, ?)`,
                        [user.id, user.name, user.email, user.password, user.role, user.profilePictureUrl || null]
                    );
                    createdCount++;
                    console.log(`✅ Created user: ${user.name} (${user.role})`);
                } else {
                    console.log(`⚠️ User already exists: ${user.name}`);
                }
            }

            console.log(`🎉 User seeding completed! Created ${createdCount} new users.`);

        } catch (error) {
            console.error('❌ Error seeding default users:', error);
            throw error;
        }
    }

    /**
     * Check if database needs initial setup
     */
    static async needsInitialSetup(database: Database<sqlite3.Database, sqlite3.Statement>): Promise<boolean> {
        try {
            const userCount = await database.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM users'
            );
            return !userCount || userCount.count === 0;
        } catch (error) {
            console.error('❌ Error checking setup status:', error);
            return true;
        }
    }

    /**
     * Run complete database seeding
     */
    static async runFullSeed(database: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
        try {
            console.log('🚀 Starting database seeding...');

            const needsSetup = await this.needsInitialSetup(database);

            if (needsSetup) {
                await this.createDefaultAdmin(database);
                console.log('🎊 Full database seeding completed successfully!');
            } 

        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            throw error;
        }
    }
}

export default DatabaseSeeder;