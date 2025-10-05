import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role, DiscountType } from '../types';
import { DiscountsService } from '../services/discounts.service';

const router = Router();

// Get all discounts
router.get('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const discounts = await DiscountsService.getAll();
        res.json(discounts);
    } catch (error: any) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({ message: 'Failed to fetch discounts' });
    }
});

// Get active discounts (public endpoint for checkout)
router.get('/active', async (req, res) => {
    try {
        const discounts = await DiscountsService.getActiveDiscounts();
        res.json(discounts);
    } catch (error: any) {
        console.error('Error fetching active discounts:', error);
        res.status(500).json({ message: 'Failed to fetch discounts' });
    }
});

// Get discount by ID
router.get('/:id', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const discount = await DiscountsService.getById(req.params.id);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        res.json(discount);
    } catch (error: any) {
        console.error('Error fetching discount:', error);
        res.status(500).json({ message: 'Failed to fetch discount' });
    }
});

// Validate discount code
router.post('/validate', async (req, res) => {
    try {
        const { code, cartTotal, itemCount } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Discount code is required' });
        }

        const validation = await DiscountsService.validateDiscount(code, cartTotal || 0, itemCount || 0);
        res.json(validation);
    } catch (error: any) {
        console.error('Error validating discount:', error);
        res.status(500).json({ message: 'Failed to validate discount' });
    }
});

// Create new discount
router.post('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const discount = await DiscountsService.create({
            ...req.body,
            createdBy: (req as any).user.sub
        });
        res.status(201).json(discount);
    } catch (error: any) {
        console.error('Error creating discount:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update discount
router.put('/:id', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const discount = await DiscountsService.update(req.params.id, req.body);
        res.json(discount);
    } catch (error: any) {
        console.error('Error updating discount:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete discount
router.delete('/:id', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        await DiscountsService.delete(req.params.id);
        res.json({ message: 'Discount deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting discount:', error);
        res.status(400).json({ message: error.message });
    }
});

// Deactivate discount
router.patch('/:id/deactivate', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const discount = await DiscountsService.deactivate(req.params.id);
        res.json(discount);
    } catch (error: any) {
        console.error('Error deactivating discount:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get discount statistics
router.get('/stats/summary', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const stats = await DiscountsService.getDiscountStats();
        res.json(stats);
    } catch (error: any) {
        console.error('Error fetching discount stats:', error);
        res.status(500).json({ message: 'Failed to fetch discount statistics' });
    }
});

export default router;