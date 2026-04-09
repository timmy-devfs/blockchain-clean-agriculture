import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();
const PORT = parseInt(process.env.PORT ?? '8090', 10);

