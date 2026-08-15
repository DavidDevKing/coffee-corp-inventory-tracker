import Router from 'express';
import { createUser, login, logout, refresh } from '../controllers/auth.controller.ts'
import { authenticateAccessRequest, authenticateRefreshRequest } from '../middleware/authenticate.ts';
import { requireAdmin } from '../middleware/authorize.ts';

const authRoutes = Router();

authRoutes.post('/admin/users', authenticateAccessRequest, requireAdmin, createUser);

authRoutes.post('/login', login);
authRoutes.post('/refresh', authenticateRefreshRequest, refresh);
authRoutes.post('/logout', authenticateAccessRequest, logout);


export default authRoutes;