import { catchError } from "../utils/CatchError";
import bcrypt from "bcryptjs";
import { Res } from "../utils/ResApi";
import { db } from "../lib/prisma";
import { redisKeys } from "../services/cacheKey.service";
import redis from "../lib/redis";
import { accessToken, refresh_token } from "../lib/generateToken";
import { refreshAccessToken } from "../services/auth.service";

export const signUp = catchError(async (req, res) => {
  const { email, fullName, password, phone, city, address1, address2 } =
    req.body;
  if (!email || !fullName || !password || !phone || !city || !address1) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "Please provide all required fields",
    });
  }

  const emailExists = await db.user.findUnique({ where: { email } });
  if (emailExists) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "Email already exists",
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 12);
  const user = await db.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      phone,
      city,
      address1,
      address2,
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  Res(res, {
    statusCode: 201,
    success: true,
    status: "success",
    message: "User created successfully",
    data: {
      user: userWithoutPassword,
    },
  });
});

export const signIn = catchError(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "Please provide email and password",
    });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return Res(res, {
      statusCode: 404,
      success: false,
      status: "fail",
      message: "User not found",
    });
  }
  const isValidPasssword = bcrypt.compareSync(password, user.password);
  if (!isValidPasssword) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "Invalid password",
    });
  }

  const { sessionId } = await refresh_token(user.id);
  accessToken(res, user.id, sessionId);

  const cacheKey = redisKeys.userAuth(user.id);
  await redis.set(
    cacheKey,
    JSON.stringify({ ...user, password: undefined, sessionId }),
  );

  const { password: _, ...userWithoutPassword } = user;

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "User signed in successfully",
    data: {
      user: userWithoutPassword,
    },
  });
});

export const refreshToken = catchError(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Unauthorized",
    });
  }
  await refreshAccessToken(res, userId, req.sessionId as string);

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Access token refreshed successfully",
  });
});

export const signOut = catchError(async (req, res) => {
  const user = req.user;
  const sessionId = req.sessionId as string;
  if (!user) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Unauthorized",
    });
  }

  const refreshTokenCacheKey = redisKeys.userSessions(user.id);
  await redis.hdel(refreshTokenCacheKey, sessionId);
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "User signed out successfully",
  });
});

export const signOutAll = catchError(async (req, res) => {
  const user = req.user;
  if (!user) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Unauthorized",
    });
  }

  const refreshTokenCacheKey = redisKeys.userSessions(user.id);
  await redis.del(refreshTokenCacheKey);
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "User signed out from all devices successfully",
  });
});

export const getCurrentUser = catchError(async (req, res) => {
  const user = req.user;
  if (!user) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "Unauthorized",
    });
  }

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "User fetched successfully",
    data: {
      user,
    },
  });
});
