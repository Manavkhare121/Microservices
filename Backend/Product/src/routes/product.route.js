import express, { Router } from 'express'
import multer from 'multer';
import upload from '../middleware/upload.middleware.js';
import { createauthmiddleware } from '../middleware/auth.middleware.js';
import { createProduct, deleteProduct, getProductById, getProducts, getProductsBySeller, updateProduct } from '../controllers/product.controller.js';
import { createProductValidator } from '../middleware/validator.middleware.js';
import { product } from '../models/product.model.js';
const router=Router();
router.post('/',createauthmiddleware(['admin','seller']),upload.array('images',5),createProduct,createProductValidator)

router.get('/',getProducts)
router.patch("/:id",createauthmiddleware(["seller"]),updateProduct)
router.delete("/:id",createauthmiddleware(["seller"]),deleteProduct)
router.get("/seller",createauthmiddleware(["seller"]),getProductsBySeller)
router.get('/:id',getProductById)
export default router;