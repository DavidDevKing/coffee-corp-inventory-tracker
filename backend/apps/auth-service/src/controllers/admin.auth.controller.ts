import type {Request, Response, NextFunction} from 'express';
import { env } from '../config/env.ts'

import { prisma } from '../config/db.ts';
import { deleteExpiredTokens, generateAccessToken, generateInvitationToken, generateRefreshToken } from '../services/token.service.ts';
import type { accessTokenPayload, invitationTokenPayload, refreshTokenPayload } from '../services/token.service.ts';
import type { accessRequest } from '../middleware/authenticate.ts';
import { sendActivationMail } from '../services/email.service.ts';
import { PrismaClientKnownRequestError } from '../generated/prisma/internal/prismaNamespace.ts';
import type { User } from '../generated/prisma/client.ts';


// Function for admins only to create new users
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
            if (e.code === "P2002") {
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
        await prisma.user.update({
            where :{
                id : newUser.id
            },
            data : {
                invitationToken : token,
                tokenExpires : new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })
        sendActivationMail(newUserData.firstName, newUserData.email, token);
    }
    catch(e){
        console.error("Faild to send invitation email", e);
        return res.status(500).json({ error : "Internal Server Error" });
    }

    return res.status(201).json({ message : "New User Created Successfully" });

}


export const deleteUser = async (req : accessRequest, res : Response, next : NextFunction) => {
    if (!req.user) return res.status(401).json({ error : "Unauthorised" });

    const user_id : number = req.body.id;

    try {
        const user = await prisma.user.delete({
            where: {
                id : user_id
            }
        })

        return res.status(202).json({ message : `User '${user.firstName} ${user.lastName}' deleted successfully`});       
    }
    catch(e){
        console.error("Failed to delete user.", e);
        if (e instanceof PrismaClientKnownRequestError){
            // Return an error if the user does not exist.
            // Not really going to matter much since they would be deleted with the frontend dashboard anyway.
            if (e.code === "P2025"){
                return res.status(404).json({ error : "User does not exist." });
            }
            return res.status(500).json({ error : "Internal server error" });
        }
    }



}