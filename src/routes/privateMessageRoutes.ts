import * as express from "express";
import { authenticateToken } from "../middlewares/authenticateToken";
import { PrivateMessage } from "../entity/PrivateMessage";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Request, Response } from "express";
import { io } from "../index";

const router = express.Router();

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { receiverUserId, message } = req.body;

    if (!receiverUserId || !message) {
      res
        .status(400)
        .json({ message: "Please provide receiverUserId and message" });
      return;
    }

    const senderUserId = req.user?.userId;

    let privateMessage = new PrivateMessage();

    const senderUser = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: senderUserId })
      .getOne();

    const receiverUser = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: receiverUserId })
      .getOne();

    privateMessage.sender = senderUser;
    privateMessage.receiver = receiverUser;
    privateMessage.message = message;

    privateMessage = await AppDataSource.getRepository(PrivateMessage).save(
      privateMessage
    );

    const roomId = [senderUserId, receiverUserId].sort().join("_") + "_pm";

    io.to(roomId).emit("new-private-message", JSON.stringify(privateMessage));

    res.status(201).json(privateMessage);
    return;
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "Something went wrong" });
    return;
  }
});

router.get(
  "/conversation/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const otherUserId = req.params.userId;

      const privateMessages = await AppDataSource.getRepository(PrivateMessage)
        .createQueryBuilder("privateMessage")
        .leftJoinAndSelect("privateMessage.sender", "sender")
        .leftJoinAndSelect("privateMessage.receiver", "receiver")
        .where(
          "privateMessage.senderId = :userId AND privateMessage.receiverId = :otherUserId",
          { userId, otherUserId }
        )
        .orWhere(
          "privateMessage.senderId = :otherUserId AND privateMessage.receiverId = :userId",
          { userId, otherUserId }
        )
        .getMany();

      res.status(200).json(privateMessages);
      return;
    } catch (error) {
      console.log({ error });
      res.status(500).json({ message: "Something went wrong" });
      return;
    }
  }
);

module.exports = router;
