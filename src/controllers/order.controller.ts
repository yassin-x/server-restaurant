import { PaymentWay } from "@prisma/client";
import { db } from "../lib/prisma";
import { catchError } from "../utils/CatchError";
import { Res } from "../utils/ResApi";

export const createOrder = catchError(async (req, res) => {
  const { items, totalPrice, paymentWay } = req.body;
  const user = req.user;
  if (!items || !totalPrice) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "fail",
      message: "يرجى تقديم جميع الحقول المطلوبة",
    });
  }

  const order = await db.order.create({
    data: {
      userId: user!.id,
      totalPrice,
      orderItems: {
        create: items.map((item: { menuId: string; quantity: number }) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      },
      paymentWay: paymentWay as PaymentWay,
    },
    include: {
      orderItems: {
        include: {
          menu: true,
        },
      },
    },
  });

  Res(res, {
    statusCode: 201,
    success: true,
    status: "success",
    message: "تم إنشاء الطلب بنجاح",
    data: {
      order,
    },
  });
});

export const getOrders = catchError(async (req, res) => {
  const user = req.user;
  const orders = await db.order.findMany({
    where: { userId: user!.id },
    include: {
      orderItems: {
        include: {
          menu: true,
        },
      },
    },
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "تم استرجاع الطلبات بنجاح",
    data: {
      orders,
    },
  });
});

export const getOrderById = catchError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const order = await db.order.findFirst({
    where: { id: id as string, userId: user!.id },
    include: {
      orderItems: {
        include: {
          menu: true,
        },
      },
    },
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "تم استرجاع الطلب بنجاح",
    data: {
      order,
    },
  });
});

export const deleteOrder = catchError(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  await db.order.deleteMany({
    where: { id: id as string, userId: user!.id },
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "تم حذف الطلب بنجاح",
  });
});
