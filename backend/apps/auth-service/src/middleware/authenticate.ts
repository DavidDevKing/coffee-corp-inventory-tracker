import type { Request, Response, NextFunction } from 'express';
import Jwt from 'jsonwebtoken';

import { verifyRefreshToken, verifyAccessToken } from '../services/token.service.ts';



export interface refreshRequest extends Request {
    user? : {
        id : number;
    }
}

export interface accessRequest extends Request{
    user? : {
        id : number;
        email : string;
        role : "ADMIN" | "MANAGER" | "USER";
    }
}



export const authenticateRefreshRequest = async (req : refreshRequest, res: Response, next: NextFunction) => {
    const tokenString : string = req.cookies.refreshToken;
    try{
        const tokenPayload = verifyRefreshToken(tokenString);
        req.user = tokenPayload;
        next();
    }
    catch(e){
        console.error("Failed to verify token", e);
        res.status(401).json({ error: 'Invalid or expired token'});
    }

}

export const authenticateAccessRequest = async (req : accessRequest, res : Response, next : NextFunction) => {
    const tokenstring : string = req.cookies.accessToken;
    try{
        const tokenPayload = verifyAccessToken(tokenstring)
        req.user = tokenPayload;
        next();
    }
    catch(e){
        if (e instanceof Error){            
            if (e.name === "TokenExpiredError"){
                res.status(401).json({ error : "Token expired"});
            }
            else {
                res.status(400).json({ errir : "Invalid Token"});
            }
        }
    }
}