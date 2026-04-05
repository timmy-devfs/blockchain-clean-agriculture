import express from "express";
import cors from "cors";
import morgan from "morgan";
import { healthRouter } from "./routes/health.route";
import { retailerRouter } from "./routes/retailer.route";
import { marketplaceRouter } from "./routes/marketplace.route";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use(healthRouter);
app.use("/api/v1", retailerRouter);
app.use("/api/retail", marketplaceRouter);

app.use(errorHandler);
