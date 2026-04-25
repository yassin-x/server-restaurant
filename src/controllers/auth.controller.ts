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
      message: "خطاء في البيانات المدخلة، يرجى التأكد من إدخال جميع الحقول المطلوبة",
    });
  }

  const emailExists = await db.user.findUnique({ where: { email } });
  if (emailExists) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "البريد الإلكتروني موجود بالفعل",
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
    message: "تم إنشاء المستخدم بنجاح",
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
      message: "يرجى تقديم البريد الإلكتروني وكلمة المرور",
    });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return Res(res, {
      statusCode: 404,
      success: false,
      status: "fail",
      message: "المستخدم غير موجود",
    });
  }
  const isValidPasssword = bcrypt.compareSync(password, user.password);
  if (!isValidPasssword) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "كلمة المرور غير صحيحة",
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
    message: "تم تسجيل الدخول بنجاح",
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
      message: "غير مصرح",
    });
  }
  await refreshAccessToken(res, userId, req.sessionId as string);

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "تم تحديث رمز الوصول بنجاح",
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
      message: "غير مصرح",
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
    message: "تم تسجيل الخروج بنجاح",
  });
});

export const signOutAll = catchError(async (req, res) => {
  const user = req.user;
  if (!user) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "غير مصرح",
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
    message: "تم تسجيل الخروج من جميع الأجهزة بنجاح",
  });
});

export const getCurrentUser = catchError(async (req, res) => {
  const user = req.user;
  if (!user) {
    return Res(res, {
      statusCode: 401,
      success: false,
      status: "fail",
      message: "غير مصرح",
    });
  }

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "تم استرجاع بيانات المستخدم بنجاح",
    data: {
      user,
    },
  });
});
