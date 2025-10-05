// src/controllers/users.controller.ts
import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../types';
import { UsersService } from '../services/users.service';
import { userUpload } from '../middlewares/upload.middleware';
import { ImageUtils } from '../utils/imageUtils';

const router = Router();

// Get all users
router.get('/', authenticateJWT, authorizeRoles(Role.Admin), async (req, res) => {
    try {
        const users = await UsersService.getAll();
        res.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Update user
router.put('/:id',
    authenticateJWT,
    authorizeRoles(Role.Admin),
    userUpload.single('profilePicture'),
    async (req, res) => {
        try {
            const data: any = { ...req.body };

            // Process profile picture - use uploaded file or keep existing/default
            if (req.file) {
                const config = ImageUtils.getStorageConfig('user');
                data.profilePictureUrl = `${config.baseUrl}${req.file.filename}`;

                // Delete old image if it exists and is not default
                const existingUser = await UsersService.getById(req.params.id);
                if (existingUser && existingUser.profilePictureUrl) {
                    await ImageUtils.deleteOldImage(existingUser.profilePictureUrl, 'user');
                }
            }
            // If no new image provided, profilePictureUrl will be handled by the service

            const updatedUser = await UsersService.update(req.params.id, data);
            res.json(updatedUser);
        } catch (error: any) {
            console.error('Error updating user:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Delete user
router.delete('/:id',
    authenticateJWT,
    authorizeRoles(Role.Admin),
    async (req, res) => {
        try {
            // Get user before deletion to handle image cleanup
            const existingUser = await UsersService.getById(req.params.id);

            const result = await UsersService.delete(req.params.id);

            // Delete associated profile picture if it exists and is not default
            if (existingUser && existingUser.profilePictureUrl) {
                await ImageUtils.deleteOldImage(existingUser.profilePictureUrl, 'user');
            }

            res.json(result);
        } catch (error: any) {
            console.error('Error deleting user:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Password change endpoint (unchanged)
router.post('/:id/change-password', authenticateJWT, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        const requestingUser = (req as any).user;
        if (requestingUser.role !== Role.Admin && requestingUser.sub !== userId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only change your own password'
            });
        }

        const result = await UsersService.changePassword(userId, currentPassword, newPassword);
        res.json(result);
    } catch (error: any) {
        console.error('Error changing password:', error);
        res.status(400).json({ message: error.message });
    }
});

// Password reset endpoint (unchanged)
router.post('/:id/reset-password',
    authenticateJWT,
    authorizeRoles(Role.Admin),
    async (req, res) => {
        try {
            const { newPassword } = req.body;
            const userId = req.params.id;

            const result = await UsersService.resetPassword(userId, newPassword);
            res.json(result);
        } catch (error: any) {
            console.error('Error resetting password:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

export default router;