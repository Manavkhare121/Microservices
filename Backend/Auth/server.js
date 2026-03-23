import app from './src/app.js'
import connectDB from './src/db/db.js'
import dotenv from "dotenv"
dotenv.config({
    path:"./.env"
})
connectDB()
app.listen(3000,()=>{
    console.log("server is running at PORT 3000")
})