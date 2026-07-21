

import {Request, Response, NextFunction} from 'express';

export interface AuthenticatedRequest extends Request{
    user?:{
        id : number;
        role : string;
    }
}


export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) =>{
    if (!req.user || req.user.role != 'ADMIN'){
        res.status(403).json({error: 'Access denied. Administrator previleges required'})
        return;
    }
    next();
};