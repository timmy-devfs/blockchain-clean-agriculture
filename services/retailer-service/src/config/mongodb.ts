import { Db, MongoClient } from "mongodb";
import { env } from "./env";

const mongoClient = new MongoClient(env.MONGODB_URI);

let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  await mongoClient.connect();
  db = mongoClient.db(env.MONGODB_DB_NAME);
  return db;
}

export async function closeMongo(): Promise<void> {
  if (!db) {
    return;
  }

  await mongoClient.close();
  db = null;
}
