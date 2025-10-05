// file: src/middlewares/requestLogger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const getClientIP = (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'Unknown';
    const baseInfo = {
        method: req.method,
        url: req.originalUrl,
        ip: clientIP,
        origin: req.get('Origin') || 'Direct',
        referer: req.get('Referer') || 'Direct',
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
    };

    logger.info('Incoming request', { ...baseInfo });

    res.on('finish', () => {
        const duration = Date.now() - start;
        // Recompute auth info at finish time (req.user may have been set by auth middleware)
        const userInfo = (req as any).user
            ? {
                id: (req as any).user.sub,
                email: (req as any).user.email,
                role: (req as any).user.role,
            }
            : 'Unauthenticated';

        const responseInfo = {
            ...baseInfo,
            user: userInfo,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: res.get('Content-Length') || 'Unknown',
        };

        if (res.statusCode >= 400) {
            logger.warn('Request completed with error', responseInfo);
        } else {
            logger.info('Request completed successfully', responseInfo);
        }
    });

    next();
};
