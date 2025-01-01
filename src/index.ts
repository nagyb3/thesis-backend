import { AppDataSource } from "./data-source";
import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";
import { initializeSocket } from "./socket";

const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const usersRoutes = require("./routes/usersRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const privateMessageRoutes = require("./routes/privateMessageRoutes");
const trackedTimeRoutes = require("./routes/trackedTimeRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

export const io = initializeSocket(server);

app.use(express.json({ limit: "100mb" }));
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
app.use("/private-messages", privateMessageRoutes);
app.use("/tracked-times", trackedTimeRoutes);
app.use("/learning-paths", learningPathRoutes);

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
  })
  .catch((error) => console.log(error));
