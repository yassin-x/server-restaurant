import { Response } from "express";

interface ResponseOptions {
  statusCode: 200 | 201 | 400 | 401 | 403 | 404 | 500;
  success: boolean;
  status: "success" | "error" | "fail";
  message?: string;
  data?: any;
}

export const Res = (
  res: Response,
  {
    statusCode = 200,
    success = true,
    status = "success",
    message = "",
    data = null,
  }: ResponseOptions,
) => {
  res.status(statusCode).json({
    success,
    status,
    message,
    data,
  });
};
