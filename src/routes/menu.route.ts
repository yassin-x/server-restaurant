import express from "express";
import { upload } from "../lib/multer";
import {
  availableMenu,
  createMenu,
  // deleteMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
} from "../controllers/menu.controller";
import { verifyOwner, verifyStaff, verifyUser } from "../middleware/verifyUser";

const router = express.Router();

router.get("/", getAllMenus);
router.get("/:id", getMenuById);
router.post("/", verifyUser, verifyOwner, upload.single("image"), createMenu);
router.put("/:id", verifyUser, verifyStaff, upload.single("image"), updateMenu);
// router.delete("/:id", verifyUser, verifyOwner, deleteMenu);
router.patch("/:id", verifyUser, verifyStaff, availableMenu);

export const menuRoutes = router;
