import mongoose from "mongoose";
import { product } from "../models/product.model.js";
import { uploadImage } from '../services/imagekit.service.js';
export async function createProduct(req, res) {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'At least one product image is required' });
  }

  try {
    const { title, description, priceAmount, priceCurrency = 'INR', stock } = req.body;
    const seller = req.user?._id || req.user?.id || req.body.seller;

    if (!seller) {
      return res.status(400).json({ error: 'Seller is required' });
    }

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    // const normalizedStock = stock !== undefined ? Number(stock) : 0;
    // if (!Number.isFinite(normalizedStock) || normalizedStock < 0) {
    //   return res.status(400).json({ error: 'stock must be a non-negative number' });
    // }

    const images = await Promise.all((req.files || []).map(file => uploadImage(file.buffer, file.originalname)));

    const Product = await product.create({
      title,
      description,
      price,
      seller,
      images,
    });

    // await publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED", product);
    //     await publishToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", {
    //         email: req.user.email,
    //         productId: product._id,
    //         sellerId: seller
    //     });


    return res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
}