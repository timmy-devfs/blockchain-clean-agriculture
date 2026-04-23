import express from "express";
import cors from "cors";
import morgan from "morgan";
import { healthRouter } from "./routes/health.route";
import { retailerRouter } from "./routes/retailer.route";
import { marketplaceRouter } from "./routes/marketplace.route";
import { orderRouter } from "./routes/order.route";
import { retailFlowRouter } from "./routes/retailFlow.route";
import { errorHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "BICAP Retailer Service API"
}));
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use(healthRouter);
app.use("/api/v1", retailerRouter);
app.use("/api/retail", marketplaceRouter);
app.use("/api/retail", orderRouter);
app.use("/api/retail", retailFlowRouter);

app.use(errorHandler);
