// src/utils/imageUtils.ts
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

export class ImageUtils {
    private static baseUploadPath = path.join(process.cwd(), 'uploads');
    private static publicImagesPath = path.join(process.cwd(), 'public', 'images');
    private static itemsImagesPath = path.join(process.cwd(), 'uploads', 'items');
    private static usersImagesPath = path.join(process.cwd(), 'uploads', 'users');

    // Default image paths
    private static defaultImages = {
        user: '/images/default-avatar.png',
        inventory: '/images/default-product.png',
        items: '/images/default-product.png'
    };

    /**
     * Initialize all required directories
     */
    static async initializeDirectories(): Promise<void> {
        const directories = [
            this.baseUploadPath,
            this.publicImagesPath,
            this.itemsImagesPath,
            this.usersImagesPath
        ];

        for (const dir of directories) {
            if (!(await existsAsync(dir))) {
                await mkdirAsync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }

    /**
     * Get storage configuration based on type
     */
    static getStorageConfig(type: 'user' | 'inventory' | 'items') {
        switch (type) {
            case 'user':
                return {
                    destination: this.usersImagesPath,
                    baseUrl: '/uploads/users/'
                };
            case 'inventory':
            case 'items':
                return {
                    destination: this.itemsImagesPath,
                    baseUrl: '/uploads/items/'
                };
            default:
                return {
                    destination: this.baseUploadPath,
                    baseUrl: '/uploads/'
                };
        }
    }

    /**
     * Get default image URL based on type
     */
    static getDefaultImage(type: 'user' | 'inventory' | 'items'): string {
        return this.defaultImages[type] || this.defaultImages.inventory;
    }

    /**
     * Process image URL - use custom if provided, otherwise use default
     */
    static processImageUrl(
        customImageUrl: string | null | undefined,
        type: 'user' | 'inventory' | 'items'
    ): string {
        return customImageUrl || this.getDefaultImage(type);
    }

    /**
     * Check if a file exists in the filesystem
     */
    static async fileExists(filePath: string): Promise<boolean> {
        try {
            return await existsAsync(filePath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Delete old image file if it's not the default one
     */
    static async deleteOldImage(
        oldImageUrl: string | null,
        type: 'user' | 'inventory' | 'items'
    ): Promise<void> {
        if (!oldImageUrl) return;

        // Don't delete default images
        const defaultImage = this.getDefaultImage(type);
        if (oldImageUrl.includes(defaultImage)) {
            return;
        }

        try {
            // Extract filename from URL
            const filename = oldImageUrl.split('/').pop();
            if (!filename) return;

            const config = this.getStorageConfig(type);
            const filePath = path.join(config.destination, filename);

            if (await this.fileExists(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted old image: ${filePath}`);
            }
        } catch (error) {
            console.error('Error deleting old image:', error);
        }
    }

    /**
     * Generate unique filename
     */
    static generateFilename(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(originalName);
        return `${timestamp}-${randomString}${extension}`;
    }
}