

import type {Request, Response, NextFunction} from 'express';
import type { accessRequest } from './authenticate.ts';


export const requireAdmin = (req: accessRequest, res: Response, next: NextFunction) =>{
    if (!req.user || req.user.role != 'ADMIN'){
        res.status(403).json({error: 'Access denied. Administrator previleges required'})
        return;
    }
    next();
};