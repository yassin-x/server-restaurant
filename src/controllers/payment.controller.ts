import { OrderStatus, PaymentStatus, PaymentWay } from "@prisma/client";
import { db } from "../lib/prisma";
import stripeClient from "../lib/stripe";
import { catchError } from "../utils/CatchError";
import { Res } from "../utils/ResApi";
import Stripe from "stripe";

export const testPayment = catchError(async (req, res) => {
  // const user = req.user;
  // const order = await db.order.findFirst({
  //   where: { userId: user!.id, status: OrderStatus.PENDING },
  //   include: {
  //     orderItems: {
  //       include: {
  //         menu: true,
  //       },
  //     },
  //   },
  // });

  // if (!order) {
  //   return Res(res, {
  //     statusCode: 404,
  //     success: false,
  //     status: "fail",
  //     message: "Order not found",
  //   });
  // }

  // const session = await stripeClient.checkout.sessions.create({
  //   payment_method_types: ["card"],
  //   mode: "payment",

  //   line_items: order.orderItems.map((item) => {
  //     const discount = item.menu.discount ?? 0;

  //     const finalPrice = item.menu.price - (item.menu.price * discount) / 100;
  //     return {
  //       price_data: {
  //         currency: "egp",
  //         product_data: {
  //           name: item.menu.name,
  //           description: item.menu.description,
  //           images: [item.menu.image],
  //         },
  //         unit_amount: Math.max(0, Math.round(finalPrice * 100)),
  //       },
  //       quantity: item.quantity,
  //       metadata: {
  //         orderId: order.id,
  //       },
  //     };
  //   }),

  //   success_url:
  //     "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
  //   cancel_url: "http://localhost:3000/cancel",
  // });

  // await db.payment.create({
  //   data: {
  //     orderId: order.id,
  //     status: PaymentStatus.PENDING,
  //     paymentWay: PaymentWay.STRIPE,
  //     sessionId: session.id,
  //   },
  // });

  const testPaymentSession = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: "Test Product",
            description: "Test Description",
            images: ["https://picsum.photos/200/300"],
          },
          unit_amount: 1000,
        },
        quantity: 1,
      },
    ],

    success_url:
      "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/cancel",
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Checkout session created successfully",
    data: {
      sessionId: testPaymentSession.id,
      sessionUrl: testPaymentSession.url,
    },
  });
});

export const checkPayment = catchError(async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  const sig = req.headers["stripe-signature"] as string;
  const event = stripeClient.webhooks.constructEvent(
    req.body,
    sig,
    webhookSecret,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await db.payment.findUnique({
      where: { sessionId: session.id },
    });

    if (!payment) {
      return Res(res, {
        statusCode: 404,
        success: false,
        status: "fail",
        message: "Payment not found",
      });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      await db.payment.update({
        where: { sessionId: session.id },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      });

      await db.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });
    }
  }

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Payment checked successfully",
  });
});
