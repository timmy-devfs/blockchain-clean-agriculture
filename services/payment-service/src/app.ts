import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { AppError } from "./errors/appError";
import { healthRouter } from "./modules/routes/health.route";
import { paymentRouter } from "./modules/routes/payment.routes";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(healthRouter);
app.use(paymentRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    res.status(error.status).json({
      code: error.code,
      message: error.message
    });
    return;
  }

  console.error("[payment-service] Unhandled error", error);
  res.status(500).json({
    code: 5999,
    message: "Internal server error"
  });
});
