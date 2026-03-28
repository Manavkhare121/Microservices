import { Router } from "express";
import { registerUserValidations,respondWithvalidationErros,loginUserValidations} from "../middleware/validator.middleware.js";
import { registerUser,loginUser,getCurrentUser,logoutUser} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = Router();

router.post('/register',registerUserValidations,respondWithvalidationErros,registerUser)
router.post('/login',loginUserValidations,loginUser)
router.get('/me',authenticateToken,getCurrentUser)
router.post('/logout',logoutUser)


export default router;