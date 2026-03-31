import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { authRouter } from "./routes/auth";
import { productRouter } from "./routes/products";
import { orderRouter } from "./routes/orders";
import { customerRouter } from "./routes/customers";
import { vehicleRouter } from "./routes/vehicles";
import { realEstateRouter } from "./routes/real-estate";
import { financeRouter } from "./routes/finance";
import { hrRouter } from "./routes/hr";
import { dashboardRouter } from "./routes/dashboard";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/error-handler";

const app = express();
const server = createServer(app);

// Socket.io for real-time
export const io = new SocketServer(server, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
});

// Global middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/real-estate", realEstateRouter);
app.use("/api/v1/finance", financeRouter);
app.use("/api/v1/hr", hrRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/admin", adminRouter);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.API_PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`[API] Server running on port ${PORT}`);
});

export default app;
