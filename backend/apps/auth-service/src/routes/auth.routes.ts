import Router from 'express';
import { login, logout, refresh } from '../controllers/auth.controller.ts'
import { authenticateAccessRequest, authenticateRefreshRequest } from '../middleware/authenticate.ts';

const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/refresh', authenticateRefreshRequest, refresh);
authRoutes.post('/logout', authenticateAccessRequest, logout);


export default authRoutes;