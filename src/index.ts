import { AppDataSource } from "./data-source";
import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";

const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const usersRoutes = require("./routes/usersRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.PRODUCTION_FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/auth", authRoutes);
app.use("/topics", topicRoutes);
app.use("/discussions", discussionRoutes);
app.use("/comments", commentRoutes);
app.use("/users", usersRoutes);
app.use("/ratings", ratingRoutes);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(async () => {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));
