import express, { Router } from 'express'
import multer from 'multer';
import upload from '../middleware/upload.middleware.js';
import { createauthmiddleware } from '../middleware/auth.middleware.js';
import { createProduct } from '../controllers/product.controller.js';
import { createProductValidator } from '../middleware/validator.middleware.js';
const router=Router();
router.post('/',createauthmiddleware(['admin','seller']),upload.array('images',5),createProduct,createProductValidator)
export default router;