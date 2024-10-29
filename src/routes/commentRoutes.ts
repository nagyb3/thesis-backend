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

router.delete("/:id", authenticateToken, async (req, res) => {
  const comment = await AppDataSource.getRepository(Comment)
    .createQueryBuilder("comment")
    .where("comment.id = :id", { id: req.params.id })
    .leftJoinAndSelect("comment.author", "author")
    .leftJoinAndSelect("comment.topic", "topic")
    .getOne();

  if (!comment) {
    res.status(404).send("Comment not found.");
    return;
  }

  if (
    comment.author.id !== req.user.userId &&
    comment.topic.moderators.every(
      (moderator) => moderator.id !== req.user.userId
    )
  ) {
    res.status(403).send("You are not allowed to delete this comment.");
    return;
  }

  try {
    await AppDataSource.getRepository(Comment).remove(comment);
    res.status(200).send("Comment deleted.");
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to delete the comment.");
    return;
  }
});

module.exports = router;
