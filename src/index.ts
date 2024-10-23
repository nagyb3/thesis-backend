import { AppDataSource } from "./data-source";
import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";
import * as jwt from "jsonwebtoken";
import { UserPayload } from "./middlewares/authenticateToken";
import { verifyRoomIdForUserId } from "./utils/verifyRoomForUserId";
import { getCookieValue } from "./utils/getCookieValue";
import { isUserInRoom } from "./utils/isUserInRoom";

const authRoutes = require("./routes/authRoutes");
const topicRoutes = require("./routes/topicRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const usersRoutes = require("./routes/usersRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const privateMessageRoutes = require("./routes/privateMessageRoutes");
const trackedTimeRoutes = require("./routes/trackedTimeRoutes");

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

export const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:5173", process.env.PRODUCTION_FRONTEND_URL],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const cookies = socket.handshake.headers.cookie;
  console.log(`${socket.id} has connected`);
  socket.on("disconnect", () => {
    console.log(`${socket.id} has disconnected`);
  });

  socket.on("join-private-message-room", (roomId) => {
    const accessTokenCookie = getCookieValue(cookies, "access_token");

    const decoded = jwt.verify(
      accessTokenCookie,
      process.env.JWT_SECRET as string
    ) as UserPayload;

    const userId = decoded?.userId;

    const isRoomIdValid = verifyRoomIdForUserId(roomId, userId, "pm");

    if (isRoomIdValid) {
      socket.join(roomId);
      socket.emit("join-private-message-room-accept", roomId);
    } else {
      socket.emit("join-private-message-room-reject", roomId);
    }
  });

  socket.on("join-video-chat-room", (roomId) => {
    const accessTokenCookie = getCookieValue(cookies, "access_token");

    const decoded = jwt.verify(
      accessTokenCookie,
      process.env.JWT_SECRET as string
    ) as UserPayload;

    const userId = decoded?.userId;

    const isRoomIdValid = verifyRoomIdForUserId(roomId, userId, "vc");

    if (isRoomIdValid) {
      socket.join(roomId);
      socket.emit("join-video-chat-room-accept", roomId);
      socket.to(roomId).emit("user-joined", userId);
    } else {
      socket.emit("join-video-chat-room-reject", roomId);
    }
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-left", userId);
    });
  });

  socket.on("offer", ({ offer, roomId }) => {
    if (isUserInRoom(socket, roomId)) {
      socket.to(roomId).emit("offer", offer);
    }
  });

  socket.on("answer", ({ answer, roomId }) => {
    if (isUserInRoom(socket, roomId)) {
      socket.to(roomId).emit("answer", answer);
    }
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    if (isUserInRoom(socket, roomId)) {
      socket.to(roomId).emit("ice-candidate", candidate);
    }
  });
});

app.use(express.json({ limit: "50mb" }));
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

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
  })
  .catch((error) => console.log(error));
