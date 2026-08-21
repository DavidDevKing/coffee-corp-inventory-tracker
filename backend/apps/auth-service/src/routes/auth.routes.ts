import Router from 'express';
import { login, logout, refresh, activateAccount, verifyInvitationToken } from '../controllers/auth.controller.ts';
import { createUser, deleteUser } from '../controllers/admin.auth.controller.ts';
import { authenticateAccessRequest, authenticateRefreshRequest } from '../middleware/authenticate.ts';
import { requireAdmin } from '../middleware/authorize.ts';

const authRoutes = Router();

authRoutes.post('/admin/users', authenticateAccessRequest, requireAdmin, createUser);
authRoutes.delete('/admin/users', authenticateAccessRequest, requireAdmin, deleteUser);

authRoutes.post('/login', login);
authRoutes.post('/refresh', authenticateRefreshRequest, refresh);
authRoutes.post('/logout', authenticateAccessRequest, logout);

authRoutes.post('/invitations/verify', verifyInvitationToken);
authRoutes.post('/invitations/accept', activateAccount);


export default authRoutes;