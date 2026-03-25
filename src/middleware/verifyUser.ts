import jwt, { JwtPayload } from "jsonwebtoken";
import { catchError } from "../utils/CatchError";
import { Res } from "../utils/ResApi";
import { redisKeys } from "../services/cacheKey.service";
import redis from "../lib/redis";
import { Role } from "@prisma/client";

export const verifyUser = catchError(async (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Unauthorized",
    });
  }

  let decoded: JwtPayload & { userId: string };
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload & { userId: string };
  } catch (error) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Invalid token",
    });
  }

  const sessionCacheKey = redisKeys.userSessions(decoded.userId);
  const storedToken = await redis.hget(sessionCacheKey, decoded.sessionId);
  if (!storedToken) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Invalid session",
    });
  }

  
  const cacheKey = redisKeys.userAuth(decoded.userId);
  const cachedUser = await redis.get(cacheKey);

  if (!cachedUser) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "User not found",
    });
  }

  req.user = JSON.parse(cachedUser);
  req.sessionId = decoded.sessionId;
  next();
});

export const verifyStaff = catchError(async (req, res, next) => {
  if (req.user?.role !== Role.STAFF && req.user?.role !== Role.OWNER) {
    return Res(res, {
      statusCode: 403,
      success: false,
      status: "fail",
      message: "Forbidden - staff access only",
    });
  }
});

export const verifyOwner = catchError(async (req, res, next) => {
  if (req.user?.role !== Role.OWNER) {
    return Res(res, {
      statusCode: 403,
      success: false,
      status: "fail",
      message: "Forbidden - owner access only",
    });
  }
});
