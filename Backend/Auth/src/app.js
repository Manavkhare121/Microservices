import express from "express";
import cookieParser from "cookie-parser";


const app=express();
app.use(express.json());
app.use(cookieParser());

import authRoutes from "../src/routes/auth.routes.js"
app.use('/api/auth',authRoutes);
export default app;