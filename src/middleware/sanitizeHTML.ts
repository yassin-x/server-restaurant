import sanitizeHtml from "sanitize-html";
import { Request, Response, NextFunction } from "express";

export const sanitizeHTML = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    });
  }
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeHtml(req.query[key] as string, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    });
  }

  next();
};
