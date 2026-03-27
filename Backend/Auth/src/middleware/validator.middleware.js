import { body, validationResult } from "express-validator";

const respondWithvalidationErros = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
const registerUserValidations = [
  body("username")
    .isString()
    .withMessage("Username must be string")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("fullName.firstName")
    .isString()
    .withMessage("First name must be a string")
    .notEmpty()
    .withMessage("First name is reuiqred"),
  body("fullName.lastName")
    .isString()
    .withMessage("last name must be a string")
    .notEmpty()
    .withMessage("last name is reuiqred"),
];

const loginUserValidations=[
   body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),

    body('username')
    .optional()
    .isString()
    .withMessage('Username must be a string')
    .notEmpty()
    .withMessage('Username is required'),

    body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required'),

    body()
    .custom((value) => {
        if (!value.email && !value.username) {
            throw new Error('Either email or username is required');
        }
        return true;
    }),

    respondWithvalidationErros
]
export { registerUserValidations, respondWithvalidationErros ,loginUserValidations};
