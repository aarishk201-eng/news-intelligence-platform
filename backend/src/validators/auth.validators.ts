import { body, ValidationChain } from 'express-validator';

/**
 * @module validators/auth.validators
 * @description Input validation rules for authentication endpoints.
 * Each export is an array of ValidationChain[] to be spread into route definitions.
 */

export const registerValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email is too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('passwordConfirm')
    .optional()
    .custom((value: string, { req }) => {
      if (value && value !== (req.body as { password: string }).password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const loginValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const changePasswordValidator: ValidationChain[] = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
    .matches(/\d/).withMessage('Must contain a number')
    .custom((value: string, { req }) => {
      if (value === (req.body as { currentPassword: string }).currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

export const forgotPasswordValidator: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
];
