import express from "express";
import cookieParser from "cookie-parser";
import Productrouter from "./routes/product.route.js";

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/product',Productrouter)

export default app;