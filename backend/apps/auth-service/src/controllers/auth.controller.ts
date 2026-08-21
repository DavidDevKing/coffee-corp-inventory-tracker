import type {Request, Response, NextFunction} from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts'

import { prisma } from '../config/db.ts';
import { deleteExpiredTokens, generateAccessToken, generateRefreshToken} from '../services/token.service.ts';
import type { accessTokenPayload, refreshTokenPayload } from '../services/token.service.ts';
import type { accessRequest, refreshRequest } from '../middleware/authenticate.ts';





// Endpoint for users to verify the invitation token when trying to activate their account
export const verifyInvitationToken = async (req : Request, res : Response, next : NextFunction) => {
    if (!req.query.token) return res.status(400).json({ error : "No token provided." });
    const token : string = req.query.token as string;

    try {
        const user = await prisma.user.findUnique({
            where: {
                invitationToken : token
            }
        });

        if (!user){
            return res.status(401).json({ error : "Invalid Token"});
        }
        if (user.isActive){
            return res.status(400).json({ error : "User already activated" });
        }
        if (user.tokenExpires && user.tokenExpires < new Date()){
            return res.status(401).json({ error : "Expired Token" });
        }

        return res.status(200).json({
            message: "Invitation Token Verified",
            user : {
                firstName : user.firstName,
                lastName : user.lastName
            }
        });
        
    }
    catch (e) {
        console.error("Failed to verify invitation token", e);
        return res.status(500).json({ error : "Internal server error" });
    }
}





export const activateAccount = async (req : Request, res : Response, next : NextFunction) => {
    try{
        // verify token
        const token : string = req.body.token;
        if (!token) return res.status(401).json({ error : "No token provided" });
        if (!req.body.password) return res.status(401).json({ error : "No password provided" });
        const user = await prisma.user.findUnique({
            where : {
                invitationToken : token
            }
        })

        if (!user){
            return res.status(401).json({ error : "Invalid Token"});
        }
        if (user.isActive){
            return res.status(400).json({ error : "User already activated" });
        }
        if (user.tokenExpires && user.tokenExpires < new Date()){
            return res.status(401).json({ error : "Expired Token" });
        }

        // Update user password and activate user
        const passwordHash : string = await bcrypt.hash(req.body.password, 12);
        await prisma.user.update({
            where : {
                id : user.id
            },
            data : {
                password : passwordHash,
                isActive : true,
                invitationToken : null,
                tokenExpires : null
            }
        })

        return res.status(200).json({ message : "Account activated successfully" });
    }
    catch(e) {
        console.error("Unnable to activate account", e)
        return res.status(500).json({ error : "Internal server error" });
    }
}





export const login = async (req: Request, res: Response, next: NextFunction) => {
    const userData : {email : string, password: string} = req.body;
    const user = await prisma.user.findUnique({
            where : {
                email : userData.email
            }
    })

    // Authenticate the user
    if (!user){
        return res.status(401).json({message : "Invalid username or password"});
    }
    const isPasswordMatch = await bcrypt.compare(userData.password, user.password as string);
    
    if (!isPasswordMatch){
        return res.status(401).json({message : "Invalid username or password"});
    }


    // Generate the tokens
    const accessPayload : accessTokenPayload = {
        id : user.id,
        firstName : user.firstName,
        lastName : user.lastName,
        email : user.email,
        role : user.role,
    }
    const refreshPayload : refreshTokenPayload = {
        id : user.id,
    }

    const accessToken = generateAccessToken(accessPayload);
    const refreshToken = generateRefreshToken(refreshPayload);



    try {
        await prisma.refreshToken.create({
            data: {
                tokenString : refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        })
    }
    
    catch (error){
        console.error(`Failed to store refresh token:`, error);
        return res.status(500).json({ message: `Login failed. Please try again` });
    }

    
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
    })
    
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure : env.NODE_ENV === 'production',
        sameSite : 'strict',
        path : 'api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // Delete all expired tokens
    await deleteExpiredTokens(user.id);
    

    res.status(200).json({message : "Logged in successfully!!!"});
}







export const refresh = async (req: refreshRequest, res: Response, next : NextFunction) => {

    if (!req.user){
        return res.status(403).json({ error : "Unauthorized"});
    }
    // Get the users information using the id from the refreshtoken payload
    const user = await prisma.user.findUnique({
        where : {
            id : req.user.id
        }
    })

    if (!user){
        return res.status(404).json({ error : "User not found"});
    }

    // Genereate a new access token
    const newTokenPayload : accessTokenPayload = {
        id : user.id,
        firstName : user.firstName,
        lastName : user.lastName,
        email : user.email,
        role : user.role
    }

    const newAccessToken = generateAccessToken(newTokenPayload);

    res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure : env.NODE_ENV === 'production',
        sameSite : 'lax',
        maxAge : 15 * 60 * 1000
    });

    res.status(200).json({ meassage : "Access token refreshed successfully"});

}






export const logout = async (req : accessRequest, res : Response, next : NextFunction) => {
    if (!req.user){
        return res.status(401).json({ error : "UnAuthorised"});
    }
    const userId = req.user.id;
    await prisma.refreshToken.delete({
        where: {
            userId : userId,
            tokenString : req.cookies.refreshToken
        }
    })
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', {path : '/api/auth'});

    await deleteExpiredTokens(userId);

    res.status(200).json({ message: "Loggout successful"});
}


