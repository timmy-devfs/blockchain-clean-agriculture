import cors from "cors";
import express from "express";
import { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { jwtMiddleware } from "./middlewares/jwtMiddleware";
import { farmRouter } from "./modules/routes/farm.routes";
import { healthRouter } from "./modules/routes/health.route";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(jwtMiddleware);

app.use(healthRouter);
app.use(farmRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[farm-service] Unhandled error", error);
  res.status(500).json({ message: "Internal Server Error" });
});
