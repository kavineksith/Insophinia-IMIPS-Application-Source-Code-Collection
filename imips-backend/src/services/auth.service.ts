import bcrypt from 'bcrypt';
import { getDB } from '../utils/db';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';

export class AuthService {
    static async register(name: string, email: string, password: string, role: string) {
        const database = getDB();
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        
        await database.run(
            'INSERT INTO users (id, name, email, password, role, profilePictureUrl) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, role, null]
        );
        
        const user = { id, name, email, role };
        const accessToken = generateAccessToken({ sub: id, email, role });
        const refreshToken = generateRefreshToken({ sub: id });
        
        return { user, accessToken, refreshToken };
    }

    static async login(email: string, password: string) {
        const database = getDB();
        const user = await database.get<User & { password: string }>(
            'SELECT * FROM users WHERE email=?', 
            [email]
        );
        
        if (!user) return null;
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return null;
        
        const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ sub: user.id });
        
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePictureUrl: user.profilePictureUrl
            },
            accessToken,
            refreshToken
        };
    }
}