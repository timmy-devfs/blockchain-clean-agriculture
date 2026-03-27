import cors from "cors";
import express from "express";
import morgan from "morgan";
import { jwtMiddleware } from "./middlewares/jwtMiddleware";
import { healthRouter } from "./modules/routes/health.route";

export const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(jwtMiddleware);

app.use(healthRouter);