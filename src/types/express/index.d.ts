import { User } from "@prisma/client";
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    sessionId?: string;
    image: Express.Multer.File;
  }
}
