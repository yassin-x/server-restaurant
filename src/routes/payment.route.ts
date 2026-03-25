import express from "express";
import { checkPayment, testPayment } from "../controllers/payment.controller";
import { verifyUser } from "../middleware/verifyUser";

const router = express.Router();

router.post("/", verifyUser, testPayment);
router.get(`/checkout-session`, verifyUser, checkPayment);

export const paymentRoutes = router;
