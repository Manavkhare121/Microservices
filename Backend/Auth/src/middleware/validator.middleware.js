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
  body("role")
  .optional()
  .isIn(['user','seller'])
  .withMessage("Role must be either 'user' or'seller'"),
  respondWithvalidationErros
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

const addUserAddressValidator = [  
    body('street')
    .isString()
    .withMessage('Street must be a string')
    .notEmpty()
    .withMessage('Street is required'),

    body('city')
    .isString()
    .withMessage('City must be a string')
    .notEmpty()
    .withMessage('City is required'),

    body('state')
    .isString()
    .withMessage('State must be a string')
    .notEmpty()
    .withMessage('State is required'),

    body('zipCode') // <-- CHANGED HERE
    .isString()
    .withMessage('Zip code must be a string')
    .notEmpty()
    .withMessage('Zip code is required'),

    body('country')
    .isString()
    .withMessage('Country must be a string')
    .notEmpty()
    .withMessage('Country is required'),

    body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

    

    respondWithvalidationErros
]
export { registerUserValidations, respondWithvalidationErros ,loginUserValidations,addUserAddressValidator};
