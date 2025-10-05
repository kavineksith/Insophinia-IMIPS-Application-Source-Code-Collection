import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    if (!result) return res.status(401).json({ message: 'Invalid credentials' });
    res.json(result);
});

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const user = await AuthService.register(name, email, password, role);
    res.json(user);
});

export default router;
