import { UserPayload } from "./middlewares/authenticateToken";
import { getCookieValue } from "./utils/getCookieValue";
import * as jwt from "jsonwebtoken";
import { verifyRoomIdForUserId } from "./utils/verifyRoomForUserId";
import { isUserInRoom } from "./utils/isUserInRoom";

export const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
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

  return io;
};
