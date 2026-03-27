import { Router } from "express";
import { registerUserValidations,respondWithvalidationErros,loginUserValidations } from "../middleware/validator.middleware.js";
import { registerUser,loginUser,getCurrentUser } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = Router();
router.post('/register',registerUserValidations,respondWithvalidationErros,registerUser)
router.post('/login',loginUserValidations,loginUser)
router.post('/me',authenticateToken,getCurrentUser)

export default router;