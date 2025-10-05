import { getDB } from '../utils/db';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { ImageUtils } from '../utils/imageUtils'; // Add this import

export class UsersService {
    static async getAll() {
        const database = getDB();
        const users = await database.all<User[]>('SELECT id, name, email, role, profilePictureUrl FROM users');

        // Process users to ensure proper image URLs with fallbacks
        return users.map(user => ({
            ...user,
            profilePictureUrl: ImageUtils.processImageUrl(user.profilePictureUrl, 'user')
        }));
    }

    static async getById(id: string) {
        const database = getDB();
        const user = await database.get<User>('SELECT id, name, email, role, profilePictureUrl FROM users WHERE id=?', [id]);

        if (user) {
            return {
                ...user,
                profilePictureUrl: ImageUtils.processImageUrl(user.profilePictureUrl, 'user')
            };
        }
        return null;
    }

    static async create(user: Omit<User, 'id'> & { password: string }) {
        const database = getDB();
        const existingUser = await database.get<User>(
            'SELECT id FROM users WHERE email = ?',
            [user.email]
        );

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const id = uuidv4();
        const hashed = await bcrypt.hash(user.password, 10);

        // Process profile picture URL before saving
        const profilePictureUrl = ImageUtils.processImageUrl(user.profilePictureUrl, 'user');

        await database.run(
            'INSERT INTO users (id, name, email, password, role, profilePictureUrl) VALUES (?, ?, ?, ?, ?, ?)',
            [id, user.name, user.email, hashed, user.role, profilePictureUrl]
        );

        return {
            id,
            ...user,
            password: undefined,
            profilePictureUrl
        };
    }

    static async update(id: string, data: Partial<User>) {
        const database = getDB();

        if (data.email) {
            const existingUser = await database.get<User>(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [data.email, id]
            );

            if (existingUser) {
                throw new Error('Another user with this email already exists');
            }
        }

        // Process profile picture URL - if not provided in update, keep existing one
        const existingUser = await this.getById(id);
        if (!data.profilePictureUrl && existingUser) {
            data.profilePictureUrl = existingUser.profilePictureUrl;
        } else {
            data.profilePictureUrl = ImageUtils.processImageUrl(data.profilePictureUrl, 'user');
        }

        const fields = Object.keys(data).map(key => `${key} = ?`).join(',');
        const values = Object.values(data);

        await database.run(`UPDATE users SET ${fields} WHERE id=?`, [...values, id]);
        return this.getById(id);
    }

    static async delete(id: string) {
        const database = getDB();

        // Prevent deleting the last admin user
        const user = await this.getById(id);
        if (user?.role === 'Admin') {
            const adminCount = await database.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM users WHERE role = ?',
                ['Admin']
            );

            if (adminCount && adminCount.count <= 1) {
                throw new Error('Cannot delete the last admin user');
            }
        }

        await database.run('DELETE FROM users WHERE id=?', [id]);

        return { message: 'User deleted successfully' };
    }

    /**
     * Change user password
     */
    static async changePassword(id: string, currentPassword: string, newPassword: string) {
        const database = getDB();

        const user = await database.get<User & { password: string }>(
            'SELECT * FROM users WHERE id=?',
            [id]
        );

        if (!user) {
            throw new Error('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await database.run(
            'UPDATE users SET password = ? WHERE id=?',
            [hashedNewPassword, id]
        );

        return { message: 'Password changed successfully' };
    }

    /**
     * Reset user password (admin function)
     */
    static async resetPassword(id: string, newPassword: string) {
        const database = getDB();

        const user = await database.get<User>('SELECT id FROM users WHERE id=?', [id]);
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await database.run(
            'UPDATE users SET password = ? WHERE id=?',
            [hashedPassword, id]
        );

        return { message: 'Password reset successfully' };
    }

    /**
     * Get users by role
     */
    static async getByRole(role: string) {
        const database = getDB();
        const users = await database.all<User[]>(
            'SELECT id, name, email, role, profilePictureUrl FROM users WHERE role = ? ORDER BY name',
            [role]
        );

        // Process users to ensure image URLs with fallbacks
        return Promise.all(
            users.map(async (user) => ({
                ...user,
                profilePictureUrl: await ImageUtils.processImageUrl(user.profilePictureUrl, 'user')
            }))
        );
    }

    /**
     * Search users by name or email
     */
    static async search(query: string) {
        const database = getDB();
        const users = await database.all<User[]>(
            `SELECT id, name, email, role, profilePictureUrl 
             FROM users 
             WHERE name LIKE ? OR email LIKE ? 
             ORDER BY name`,
            [`%${query}%`, `%${query}%`]
        );

        // Process users to ensure image URLs with fallbacks
        return Promise.all(
            users.map(async (user) => ({
                ...user,
                profilePictureUrl: await ImageUtils.processImageUrl(user.profilePictureUrl, 'user')
            }))
        );
    }

    /**
     * Check if email is available
     */
    static async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
        const database = getDB();

        let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        const params: any[] = [email];

        if (excludeUserId) {
            query += ' AND id != ?';
            params.push(excludeUserId);
        }

        const result = await database.get<{ count: number }>(query, params);
        return result ? result.count === 0 : true;
    }
}