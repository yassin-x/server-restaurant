import { Response } from "express";
import { accessToken } from "../lib/generateToken";
import redis from "../lib/redis";
import { redisKeys } from "./cacheKey.service";

export const refreshAccessToken = async (
  res: Response,
  userId: string,
  sessionId: string,
) => {
  const cacheKey = redisKeys.userSessions(userId);
  const token = await redis.hget(cacheKey, sessionId);

  if (!token) {
    throw new Error("Unauthorized - refresh token missing or expired");
  }

  accessToken(res, userId, sessionId);

  return true;
};
