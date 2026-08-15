import nodemailer from 'nodemailer';
import { env } from '../config/env.ts';

export const sendActivationMail = async (recipient : string, email : string, token : string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth : { user: env.EMAIL_USER, pass: env.EMAIL_PASSOWRD },
    })
    const url = `${env.BASE_URL}/api/auth/verify?token=${token}`;

    await transporter.sendMail({
        from: env.EMAIL_USER,
        to: email,
        subject: 'Activate Account',
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Dear ${recipient},</h2>
            <p>Your account has been processed. Please click the link below to activate it.</p>
            <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Activate Account
            </a>
            <p style="color : #777; font-style: italic">If this isn't you, or you got this email by accident, you can safely ignore.</p>
        </div>`
    })



}