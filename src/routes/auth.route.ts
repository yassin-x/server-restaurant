import express from "express";
import { verifyUser } from "../middleware/verifyUser";
import {
  getCurrentUser,
  refreshToken,
  signIn,
  signOut,
  signOutAll,
  signUp,
} from "../controllers/auth.controller";

const router = express.Router();

router.get("/profile", verifyUser, getCurrentUser);
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/refresh-token", verifyUser, refreshToken);
router.delete("/sign-out", verifyUser, signOut);
router.delete("/sign-out-all", verifyUser, signOutAll);

export const authRoutes = router;
