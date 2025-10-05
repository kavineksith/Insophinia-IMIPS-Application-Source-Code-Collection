// src/controllers/inventory.controller.ts
import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../types';
import { InventoryService } from '../services/inventory.service';
import { inventoryUpload } from '../middlewares/upload.middleware';
import { ImageUtils } from '../utils/imageUtils';

const router = Router();

// Get all inventory items
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const items = await InventoryService.getAll();
        res.json(items);
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Failed to fetch inventory items' });
    }
});

// Create new inventory item
router.post('/',
    authenticateJWT,
    authorizeRoles(Role.Admin, Role.Manager),
    inventoryUpload.single('image'),
    async (req, res) => {
        try {
            const data: any = { ...req.body };

            // Process image - use uploaded file or default
            if (req.file) {
                const config = ImageUtils.getStorageConfig('inventory');
                data.imageUrl = `${config.baseUrl}${req.file.filename}`;
            } else {
                data.imageUrl = ImageUtils.processImageUrl(null, 'inventory');
            }

            const item = await InventoryService.add(data);
            res.status(201).json(item);
        } catch (error: any) {
            console.error('Error creating inventory item:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Update inventory item
router.put('/:id',
    authenticateJWT,
    authorizeRoles(Role.Admin, Role.Manager),
    inventoryUpload.single('image'),
    async (req, res) => {
        try {
            const data: any = { ...req.body, id: req.params.id };

            // Process image - use uploaded file or keep existing/default
            if (req.file) {
                const config = ImageUtils.getStorageConfig('inventory');
                data.imageUrl = `${config.baseUrl}${req.file.filename}`;

                // Delete old image if it exists and is not default
                const existingItem = await InventoryService.getById(req.params.id);
                if (existingItem && existingItem.imageUrl) {
                    await ImageUtils.deleteOldImage(existingItem.imageUrl, 'inventory');
                }
            }
            // If no new image provided, imageUrl will be handled by the service

            const updatedItem = await InventoryService.update(data);
            res.json(updatedItem);
        } catch (error: any) {
            console.error('Error updating inventory item:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Delete inventory item
router.delete('/:id',
    authenticateJWT,
    authorizeRoles(Role.Admin, Role.Manager),
    async (req, res) => {
        try {
            // Get item before deletion to handle image cleanup
            const existingItem = await InventoryService.getById(req.params.id);

            const result = await InventoryService.delete(req.params.id);

            // Delete associated image if it exists and is not default
            if (existingItem && existingItem.imageUrl) {
                await ImageUtils.deleteOldImage(existingItem.imageUrl, 'inventory');
            }

            res.json(result);
        } catch (error: any) {
            console.error('Error deleting inventory item:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

export default router;