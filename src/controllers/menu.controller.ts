import { MenuCategory } from "@prisma/client";
import { db } from "../lib/prisma";
import {
  addCloudinaryImage,
  deleteCloudinaryImage,
} from "../services/cloudinary.service";
import { catchError } from "../utils/CatchError";
import { Res } from "../utils/ResApi";
import { CloudinaryFolders } from "../constants/enums";

export const createMenu = catchError(async (req, res) => {
  const { name, description, price, discount, category, isAvailable } =
    req.body;
  if (!name || !description || !price || !category) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "error",
      message: "Bad Request: Missing required fields",
    });
  }
  const image = req.file;
  if (!image) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "error",
      message: "Bad Request: Image file is required",
    });
  }
  const imageUrl = await addCloudinaryImage(
    image.buffer,
    CloudinaryFolders.MENU,
  );

  if (!imageUrl) {
    return Res(res, {
      statusCode: 500,
      success: false,
      status: "error",
      message: "Internal Server Error: Failed to upload image",
    });
  }
  const menu = await db.menu.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      category: category as MenuCategory,
      image: imageUrl,
      isAvailable,
    },
  });

  Res(res, {
    statusCode: 201,
    success: true,
    status: "success",
    message: "Menu item created successfully",
    data: {
      menu,
    },
  });
});

export const updateMenu = catchError(async (req, res) => {
  const { id } = req.params;
  const oldMenu = await db.menu.findUnique({ where: { id: id as string } });
  if (!oldMenu) {
    return Res(res, {
      statusCode: 404,
      success: false,
      status: "error",
      message: "Menu item not found",
    });
  }

  const { name, description, price, discount, category, isAvailable } =
    req.body;
  if (!id || !name || !description || !price || !category) {
    return Res(res, {
      statusCode: 400,
      success: false,
      status: "error",
      message: "Bad Request: Missing required fields",
    });
  }
  const image = req.file;
  let newImageUrl;
  if (image) {
    const oldImagePublicId = oldMenu.image
      .split("/")
      .slice(-1)[0]
      .split(".")[0];
    await deleteCloudinaryImage(oldImagePublicId, CloudinaryFolders.MENU);

    newImageUrl = await addCloudinaryImage(
      image.buffer,
      CloudinaryFolders.MENU,
    );
  }

  const updatedMenu = await db.menu.update({
    where: { id: id as string },
    data: {
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      category: category as MenuCategory,
      image: newImageUrl || oldMenu.image,
      isAvailable,
    },
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Menu item updated successfully",
    data: {
      menu: updatedMenu,
    },
  });
});

export const deleteMenu = catchError(async (req, res) => {
  const { id } = req.params;
  const menu = await db.menu.findUnique({ where: { id: id as string } });
  if (!menu) {
    return Res(res, {
      statusCode: 404,
      success: false,
      status: "error",
      message: "Menu item not found",
    });
  }
  const imagePublicId = menu.image.split("/").slice(-1)[0].split(".")[0];
  await deleteCloudinaryImage(imagePublicId, CloudinaryFolders.MENU);
  await db.menu.delete({ where: { id: id as string } });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Menu item deleted successfully",
  });
});

export const getAllMenus = catchError(async (req, res) => {
  const menus = await db.menu.findMany();
  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: "Menu items fetched successfully",
    data: {
      menus,
    },
  });
});

export const availableMenu = catchError(async (req, res) => {
  const { id } = req.params;
  const menu = await db.menu.findUnique({ where: { id: id as string } });
  if (!menu) {
    return Res(res, {
      statusCode: 404,
      success: false,
      status: "error",
      message: "Menu item not found",
    });
  }
  const updatedMenu = await db.menu.update({
    where: { id: id as string },
    data: {
      isAvailable: !menu.isAvailable,
    },
  });

  Res(res, {
    statusCode: 200,
    success: true,
    status: "success",
    message: `Menu item is now ${updatedMenu.isAvailable ? "available" : "unavailable"}`,
    data: {
      menu: updatedMenu,
    },
  });
});
