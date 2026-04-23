import cors from "cors";
import express from "express";
import { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { jwtMiddleware } from "./middlewares/jwtMiddleware";
import { farmRouter } from "./modules/routes/farm.routes";
import { healthRouter } from "./modules/routes/health.route";
import { marketplaceRouter } from "./modules/routes/marketplace.routes";
import { orderRouter } from "./modules/routes/order.routes";
import { seasonRouter } from "./modules/routes/season.routes";
import { shipmentRouter } from "./modules/routes/shipment.routes";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';


export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(jwtMiddleware);

// Swagger UI — đặt TRƯỚC các routes khác
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BICAP Farm Service API',
}));

app.use(healthRouter);
app.use(farmRouter);
app.use(seasonRouter);
app.use(marketplaceRouter);
app.use(orderRouter);
app.use(shipmentRouter);


// Endpoint trả về JSON spec
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[farm-service] Unhandled error", error);
  res.status(500).json({ message: "Internal Server Error" });
});
