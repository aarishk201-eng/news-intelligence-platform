import { body, query, param, ValidationChain } from 'express-validator';
import mongoose from 'mongoose';

/**
 * @module validators/news.validators
 */

const isMongoId = (value: string): boolean => mongoose.Types.ObjectId.isValid(value);

export const createArticleValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title cannot exceed 500 characters'),

  body('summary')
    .trim()
    .notEmpty().withMessage('Summary is required')
    .isLength({ max: 1000 }).withMessage('Summary cannot exceed 1000 characters'),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required'),

  body('url')
    .trim()
    .notEmpty().withMessage('Source URL is required')
    .isURL().withMessage('URL must be a valid URL'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .custom(isMongoId).withMessage('Category must be a valid ID'),

  body('source.name')
    .trim()
    .notEmpty().withMessage('Source name is required'),

  body('language')
    .optional()
    .isLength({ max: 5 }).withMessage('Language code too long')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/).withMessage('Invalid language code (e.g. en, fr, zh-CN)'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags: unknown[]) => tags.length <= 20).withMessage('Maximum 20 tags allowed'),
];

export const getArticlesValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100').toInt(),
  query('language').optional().isLength({ max: 5 }).withMessage('Invalid language code'),
  query('sort').optional().matches(/^-?[a-zA-Z,._]+$/).withMessage('Invalid sort parameter'),
  query('fields').optional().matches(/^[a-zA-Z,._]+$/).withMessage('Invalid fields parameter'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search query too long'),
  query('keyword').optional().isString().trim().isLength({ max: 50 }).withMessage('Keyword too long'),
  query('sentiment').optional().isIn(['positive', 'negative', 'neutral']).withMessage('Invalid sentiment label'),
  query('category').optional().custom((val: string) => mongoose.Types.ObjectId.isValid(val)).withMessage('Invalid category ID format'),
];

export const articleIdValidator: ValidationChain[] = [
  param('id')
    .notEmpty().withMessage('Article ID is required')
    .custom((val: string) => mongoose.Types.ObjectId.isValid(val) || val.length > 0)
    .withMessage('Invalid article ID format'),
];

export const chatMessageValidator: ValidationChain[] = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be 1–2000 characters'),

  body('conversationHistory')
    .optional()
    .isArray({ max: 20 }).withMessage('Conversation history cannot exceed 20 messages'),

  body('conversationHistory.*.role')
    .optional()
    .isIn(['user', 'assistant']).withMessage('Role must be user or assistant'),

  body('conversationHistory.*.content')
    .optional()
    .isString().withMessage('Content must be a string')
    .isLength({ max: 5000 }).withMessage('Message content too long'),

  body('articleId')
    .optional()
    .custom(isMongoId).withMessage('Invalid article ID'),
];
