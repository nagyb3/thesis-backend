import * as express from "express";
import { AppDataSource } from "../data-source";
import { Discussion } from "../entity/Discusson";
import { Comment } from "../entity/Comment";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .leftJoinAndSelect("discussion.author", "author")
      .leftJoinAndSelect("discussion.comments", "comments")
      .leftJoinAndSelect("comments.author", "comments_author")
      .select([
        "discussion",
        "comments",
        "comments_author",
        "author.username",
        "author.id",
      ])
      .where("discussion.id = :id", { id: req.params.id })
      .getOne();

    if (!discussion) {
      res.status(404).send("Discussion not found.");
      return;
    }

    res.status(200).send(discussion);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get the discussion.");
    return;
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .where("discussion.id = :id", { id: req.params.id })
      .leftJoinAndSelect("discussion.comments", "comments")
      .getOne();

    if (!discussion) {
      res.status(404).send("Discussion not found.");
      return;
    }

    await AppDataSource.getRepository(Comment).remove(discussion.comments);

    await AppDataSource.getRepository(Discussion).remove(discussion);
    res.status(200).send("Discussion deleted.");
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to delete the discussion.");
    return;
  }
});

router.put("/:id", async (req, res) => {
  try {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .where("discussion.id = :id", { id: req.params.id })
      .getOne();

    if (!discussion) {
      res.status(404).send("Discussion not found.");
      return;
    }

    discussion.title = req.body.title ?? discussion.title;
    discussion.content = req.body.content ?? discussion.content;

    await AppDataSource.getRepository(Discussion).save(discussion);
    res.status(200).send(discussion);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to update the discussion.");
    return;
  }
});

module.exports = router;
