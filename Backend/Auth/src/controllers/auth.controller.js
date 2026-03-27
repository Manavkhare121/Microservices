import { userModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../db/redis.js"

export async function registerUser(req, res) {
  const { username, email, password, fullName: { firstName, lastName } } = req.body;

  
    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }]
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        error: "Email or Username already in use"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      fullName: { firstName, lastName }
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        addresses: user.addresses
      }
    });

  
}

export async function loginUser(req,res){
  try{
    const {username,email,password}=req.body;
    const user=await userModel.findOne({$or:[{email},{username}]}).select('+password')

    if(!user){
      return res.status(401).json({message:'Invalid credentials'})
    }

    const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName
            },
            role: user.role,
            address: user.addresses
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCurrentUser(req, res) {
    const user = req.user;

    return res.status(200).json({
        message: 'Current user fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            address: user.addresses
        }
    });
}

export async function logoutUser(req, res) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
    };

    try {
        const decoded = jwt.decode(token);
        const ttlSeconds = decoded?.exp
            ? Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0)
            : 0;

        if (ttlSeconds > 0 && typeof redis?.set === 'function') {
            await redis.set(`bl:${token}`, 'true', 'EX', ttlSeconds || 1);
        }
    } catch (error) {
      //user token is enter in blacklist and cookies token also get removed by server
        console.error('Error blacklisting token:', error);
    } finally {
        res.cookie('token', '', cookieOptions);
    }

    return res.status(200).json({ message: 'User logged out successfully' });
}