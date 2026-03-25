import dotenv from "dotenv";
import app from "./app";

dotenv.config();
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(
    `Server running in "${process.env.NODE_ENV}" mode on port ${PORT}`,
  );
  console.log(`URL: http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err: any) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
