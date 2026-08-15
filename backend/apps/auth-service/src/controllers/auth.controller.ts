import type {Request, Response, NextFunction} from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.ts'

import { prisma } from '../config/db.ts';
import { deleteExpiredTokens, generateAccessToken, generateInvitationToken, generateRefreshToken, verifyRefreshToken } from '../services/token.service.ts';
import type { accessTokenPayload, invitationTokenPayload, refreshTokenPayload } from '../services/token.service.ts';
import type { accessRequest, refreshRequest } from '../middleware/authenticate.ts';
import { sendActivationMail } from '../services/email.service.ts';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace.ts';
import type { User } from '../generated/prisma/client.ts';

export const createUser = async (req: accessRequest, res : Response, next : NextFunction) => {
    if (!req.user) return res.status(401).json({ error : "Unauthorised" });

    // Create the new user
    const newUserData : {firstName : string, lastName : string, email : string, role : 'ADMIN'|'MANAGER'|'USER'} = req.body;

    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.role) {
        return res.status(400).json({ error : "Missing Required Fields" });
    }
    if (!["MANAGER", "ADMIN", "USER"].includes(newUserData.role)){
        return res.status(400).json({ error : "Invalid role provided." });
    }

    let newUser : User;
    try{
        newUser = await prisma.user.create({
            data : {
                email : newUserData.email,
                firstName : newUserData.firstName,
                lastName : newUserData.lastName,
                role : newUserData.role,
            }
        })
    }
    catch(e : any){
        console.error("Couldn't create new user:", e);
        if (e instanceof PrismaClientKnownRequestError) {
            if (e.code = "P2002") {
                return res.status(409).json({ error : "Email already exists" });
            }
        }
        return res.status(500).json({ error : "Internal server error"});
    }


    // Generate Token
    const invitationTokenPayload : invitationTokenPayload = {
        id : newUser.id
    }
    const token = generateInvitationToken(invitationTokenPayload);


    try {
        sendActivationMail(newUserData.firstName, newUserData.email, token);
    }
    catch(e){
        console.error("Faild to send invitation email", e);
        return res.status(500).json({ error : "Internal Server Error" });
    }

    return res.status(201).json({ message : "New User Created Successfully" });

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
    const isPassowrdMatch = bcrypt.compare(userData.password, user.passowrd as string);
    
    if (!isPassowrdMatch){
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