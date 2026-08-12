import Jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { prisma } from '../config/db.ts';


export interface accessTokenPayload {
    id : number,
    email : string,
    role : 'ADMIN' | 'MANAGER' | 'USER'
}
export interface refreshTokenPayload {
    id : number,
}


export const generateAccessToken = (payload: accessTokenPayload) => {
    return Jwt.sign(payload, env.ACCESS_SECRET ,{'expiresIn': '15m'});
}

export const generateRefreshToken = (payload : refreshTokenPayload) =>{
    return Jwt.sign(payload, env.REFRESH_SECRET, {expiresIn: '1d'});
}

export const verifyAccessToken = (token : string) : accessTokenPayload => {
    return Jwt.verify(token, env.ACCESS_SECRET) as accessTokenPayload;
}

export const verifyRefreshToken = (token : string) : refreshTokenPayload => {
    return Jwt.verify(token, env.REFRESH_SECRET) as refreshTokenPayload;
}

export const deleteExpiredTokens = async (id : number) => {
    await prisma.refreshToken.deleteMany({
        where: {
            userId : id,
            expiresAt : { lt : new Date()}
        }
    })
}