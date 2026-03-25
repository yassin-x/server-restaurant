import express from "express";

import { verifyUser } from "../middleware/verifyUser";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
} from "../controllers/order.controller";

const router = express.Router();

router.post("/", verifyUser, createOrder);
router.get("/", verifyUser, getOrders);
router.get("/:id", verifyUser, getOrderById);
router.delete("/:id", verifyUser, deleteOrder);

export const orderRoutes = router;
