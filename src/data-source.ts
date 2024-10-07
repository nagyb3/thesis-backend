import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";

import * as dotenv from "dotenv";
import { Topic } from "./entity/Topic";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User, Topic],
  migrations: [],
  subscribers: [],
});
