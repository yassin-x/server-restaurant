import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Response } from "express";
import { redisKeys } from "../services/cacheKey.service";
import redis from "./redis";

export const accessToken = (
  res: Response,
  userId: string,
  sessionId: string,
) => {
  const access_token = jwt.sign(
    { userId, sessionId },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "7d" },
  );

  res.cookie("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return true;
};

export const refresh_token = async (userId: string) => {
  const cacheKey = redisKeys.userSessions(userId);
  const sessionId = randomUUID();
  const token = jwt.sign(
    { userId, sessionId },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "14d",
    },
  );

  await redis.hset(cacheKey, sessionId, token);
  await redis.expire(cacheKey, 14 * 24 * 60 * 60);

  return { sessionId };
};
