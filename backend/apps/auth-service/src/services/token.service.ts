import Jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { prisma } from '../config/db.ts';


export interface accessTokenPayload {
    id : number,
    email : string,
    firstName : string,
    lastName : string,
    role : 'ADMIN' | 'MANAGER' | 'USER'
}
export interface refreshTokenPayload {
    id : number,
}

export interface invitationTokenPayload {
    id : number,
}


export const generateAccessToken = (payload: accessTokenPayload) : string => {
    return Jwt.sign(payload, env.ACCESS_SECRET ,{'expiresIn': '15m'});
}

export const generateRefreshToken = (payload : refreshTokenPayload) : string =>{
    return Jwt.sign(payload, env.REFRESH_SECRET, {expiresIn: '7d'});
}

export const generateInvitationToken = (payload : invitationTokenPayload) : string => {
    return Jwt.sign(payload, env.INVITATION_SECRET, {expiresIn : '1d'});
}

export const verifyAccessToken = (token : string) : accessTokenPayload => {
    return Jwt.verify(token, env.ACCESS_SECRET) as accessTokenPayload;
}

export const verifyRefreshToken = (token : string) : refreshTokenPayload => {
    return Jwt.verify(token, env.REFRESH_SECRET) as refreshTokenPayload;
}

export const verifyInvitationToken = (token : string) : invitationTokenPayload => {
    return Jwt .verify(token, env.INVITATION_SECRET) as invitationTokenPayload;
}

export const deleteExpiredTokens = async (id : number) => {
    await prisma.refreshToken.deleteMany({
        where: {
            userId : id,
            expiresAt : { lt : new Date()}
        }
    })
}