import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../types';
import { InquiriesService } from '../services/inquiries.service';

const router = Router();

router.get('/', authenticateJWT, async (req, res) => {
    const inquiries = await InquiriesService.getAll();
    res.json(inquiries);
});

router.post('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager, Role.Staff), async (req, res) => {
    const inquiry = await InquiriesService.add(req.body);
    res.json(inquiry);
});

router.put('/:id', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager, Role.Staff), async (req, res) => {
    const data = { ...req.body, id: req.params.id };
    const inquiries = await InquiriesService.update(data);
    res.json(inquiries);
});

router.delete('/:id', authenticateJWT, authorizeRoles(Role.Admin), async (req, res) => {
    await InquiriesService.delete(req.params.id);
    res.json({ message: 'Inquiry deleted' });
});

export default router;
