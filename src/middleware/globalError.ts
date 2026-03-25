import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import { Enviroments } from "../constants/enums";

/**
 * @param err
 */
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid  ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * @param err
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = Object.values(err.keyValue).join(", ");
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * @param err
 */
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

/**
 * @param err
 * @param res
 */
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * @param err
 * @param res
 */
const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // console.log(err);
  if (process.env.NODE_ENV === Enviroments.DEV) {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === Enviroments.PROD) {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err._message === "Validation failed")
      error = handleValidationErrorDB(err);

    sendErrorProd(error as AppError, res);
  }
};

export default globalErrorHandler;
