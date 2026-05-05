import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { jwtMiddleware } from "./middlewares/jwtMiddleware";
import { sensorRouter } from "./modules/routes/sensor.routes";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "UP" });
});

app.use(jwtMiddleware);

app.use(sensorRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[iot-service] Unhandled error", error);
  res.status(500).json({ message: "Internal Server Error" });
});
