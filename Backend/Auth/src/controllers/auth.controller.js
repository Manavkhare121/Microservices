import { userModel } from "../src/models/user.model.js";

async function registerUser(params) {
    const {username,email,password,fullName:{firstName,lastName}} =req.body  
}