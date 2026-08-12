import express from "express";
import type { Request, Response, Express, NextFunction } from "express";
import cookieParser from "cookie-parser";

import cors from 'cors';


import authRoutes from "./routes/auth.routes.ts";



const app : Express = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
    res.send('Hello from the authentication service.');
})


app.use('/api/auth', authRoutes);


app.use((req : Request, res : Response, next : NextFunction) => {
    res.status(404).json({error: 'Route not found.'})
})

export default app;