import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../types';
import { BackupService } from '../services/backup.service';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: path.join(__dirname, '..', 'backups') });

router.post('/create', authenticateJWT, authorizeRoles(Role.Admin), async (req, res) => {
    const file = await BackupService.createBackup();
    res.json({ message: 'Backup created', file });
});

router.post('/restore', authenticateJWT, authorizeRoles(Role.Admin), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No backup file uploaded' });
    const result = await BackupService.restoreBackup(req.file.path);
    res.json(result);
});

export default router;
