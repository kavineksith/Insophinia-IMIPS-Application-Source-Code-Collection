import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role, OrderStatus } from '../types';
import { OrdersService } from '../services/orders.service';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager, Role.Staff), async (req, res) => {
    const orders = await OrdersService.getAll();
    res.json(orders);
});

router.post('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager, Role.Staff), async (req, res) => {
    const { customer, cart, discount } = req.body;
    const createdBy = (req as any).user.sub;
    const order = await OrdersService.createOrder(customer, cart, discount, createdBy);
    res.json(order);
});

router.put('/:id/status', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    const { status } = req.body;
    const orders = await OrdersService.updateStatus(req.params.id, status as OrderStatus);
    res.json(orders);
});

export default router;
