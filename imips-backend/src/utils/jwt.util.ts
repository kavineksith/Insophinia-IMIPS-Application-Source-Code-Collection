import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

export const generateAccessToken = (payload: object) =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });

export const generateRefreshToken = (payload: object) =>
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

export const verifyAccessToken = (token: string) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token: string) => jwt.verify(token, REFRESH_SECRET);
