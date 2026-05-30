import { Router } from 'express';
import { auth } from '@src/middleware/auth';

const router = Router();

router.use(auth);

// Placeholder - all member routes will be added here
router.get('/', (_req, res) => {
  res.json({ success: true, message: 'Members endpoint', data: [] });
});

export default router;
