import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sanitizeHTML } from "./middleware/sanitizeHTML";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Enviroments } from "./constants/enums";
import AppError from "./utils/AppError";
import { authRoutes } from "./routes/auth.route";
import globalErrorHandler from "./middleware/globalError";
import { menuRoutes } from "./routes/menu.route";
import { orderRoutes } from "./routes/order.route";
import { paymentRoutes } from "./routes/payment.route";

dotenv.config();
const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === Enviroments.PROD ? "combined" : "dev"));
app.use(cookieParser());
app.use(sanitizeHTML);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
