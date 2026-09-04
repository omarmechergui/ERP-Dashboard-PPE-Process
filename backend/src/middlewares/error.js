const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');
const { AppError } = require('../helpers/AppError');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'StockError' || (err.statusCode && err.code)) {
    return res.status(err.statusCode || 400).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details || null
    });
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Une erreur interne du serveur est survenue";
  let code = 'INTERNAL_ERROR';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.errors[0].message;
    code = 'VALIDATION_ERROR';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = "Un enregistrement avec cette valeur existe déjà (violation de contrainte unique).";
      code = 'UNIQUE_CONSTRAINT';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = "Enregistrement non trouvé.";
      code = 'NOT_FOUND';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = "Échec de la contrainte de clé étrangère. L'enregistrement référencé n'existe pas.";
      code = 'FOREIGN_KEY_CONSTRAINT';
    }
  }

  res.status(statusCode).json({
    success: false,
    code,
    message: message,
  });
};

module.exports = errorHandler;
