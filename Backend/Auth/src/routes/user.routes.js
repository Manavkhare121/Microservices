import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { addUserAddress, deleteUserAddress, getUserAddresses } from '../controllers/user.controller.js';
import { addUserAddressValidator } from '../middleware/validator.middleware.js';

const router = express.Router();

router.get('/me/addresses', authenticateToken, getUserAddresses);

router.post(
  '/me/addresses',
  authenticateToken,        
  addUserAddressValidator,   
  addUserAddress
);

router.delete('/me/addresses/:addressId', authenticateToken, deleteUserAddress);

export default router;