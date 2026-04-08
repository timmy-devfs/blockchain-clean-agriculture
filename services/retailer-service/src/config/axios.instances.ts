import axios from "axios";
import { env } from "./env";

export const farmAxios = axios.create({
  baseURL: env.FARM_SERVICE_BASE_URL,
  timeout: 5000
});

export const chainAxios = axios.create({
  baseURL: env.BLOCKCHAIN_SERVICE_BASE_URL,
  timeout: 5000
});

export const paymentAxios = axios.create({
  baseURL: env.PAYMENT_SERVICE_BASE_URL,
  timeout: 5000
});
