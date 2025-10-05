// src/middlewares/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import { ImageUtils } from '../utils/imageUtils';

// Initialize multer storage configuration
const createStorage = (type: 'user' | 'inventory' | 'items') => {
    const config = ImageUtils.getStorageConfig(type);

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, config.destination);
        },
        filename: (req, file, cb) => {
            const filename = ImageUtils.generateFilename(file.originalname);
            cb(null, filename);
        }
    });
};

// Create multer instances for different types
export const userUpload = multer({
    storage: createStorage('user'),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const inventoryUpload = multer({
    storage: createStorage('inventory'),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const itemsUpload = multer({
    storage: createStorage('items'),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});