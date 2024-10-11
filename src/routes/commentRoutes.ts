import * as express from "express";
import { Comment } from "../entity/Comment";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import { Discussion } from "../entity/Discusson";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const comment = new Comment();

  if (!req.body.content || !req.body.discussionId) {
    res.status(400).send("Please provide all required fields.");
    return;
  }

  comment.content = req.body.content;

  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.user.userId })
      .getOneOrFail();

    comment.author = user;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get the user.");
    return;
  }

  try {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .where("discussion.id = :id", { id: req.body.discussionId })
      .getOneOrFail();

    comment.discussion = discussion;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get the discussion.");
    return;
  }

  try {
    await AppDataSource.getRepository(Comment).save(comment);

    res.status(201).send(comment);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to save the comment.");
    return;
  }
});

module.exports = router;
