import { Router } from "express";
import { registerUserValidations,respondWithvalidationErros } from "../middleware/validator.middleware.js";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();
router.post('/register',registerUserValidations,respondWithvalidationErros,registerUser)

export default router;