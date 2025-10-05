import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../types';
import { EmailsService } from '../services/emails.service';

const router = Router();

// Get all sent emails (history)
router.get('/', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    try {
        const emails = await EmailsService.getAll();
        res.json(emails);
    } catch (error: any) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ message: 'Failed to fetch emails' });
    }
});

// Send email (existing endpoint)
router.post('/send', authenticateJWT, authorizeRoles(Role.Admin, Role.Manager), async (req, res) => {
    const { recipient, subject, body } = req.body;
    try {
        await EmailsService.sendEmail({ recipient, subject, body });
        res.json({ message: 'Email sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send email' });
    }
});

export default router;
