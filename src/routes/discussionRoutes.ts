import * as express from "express";
import { AppDataSource } from "../data-source";
import { Discussion } from "../entity/Discusson";
import { Comment } from "../entity/Comment";
import { authenticateToken } from "../middlewares/authenticateToken";
import { User } from "../entity/User";
import { DiscussionFeedback } from "../entity/DiscussionFeedback";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .leftJoinAndSelect("discussion.author", "author")
      .leftJoinAndSelect("discussion.comments", "comments")
      .leftJoinAndSelect("comments.author", "comments_author")
      .leftJoinAndSelect("discussion.discussionFeedback", "discussionFeedback")
      .leftJoinAndSelect("discussionFeedback.user", "discussionFeedbackUser")
      .select([
        "discussion",
        "comments",
        "comments_author",
        "discussionFeedback",
        "discussionFeedbackUser",
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

router.post("/:id/discussion-feedback", authenticateToken, async (req, res) => {
  const feedback = req.body.feedback;

  if (feedback !== "like" && feedback !== "dislike" && feedback !== "none") {
    res.status(400).send("Invalid feedback type.");
    return;
  }

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: req.user.userId })
    .getOne();

  const alreadyGivenFeedback = await AppDataSource.getRepository(
    DiscussionFeedback
  )
    .createQueryBuilder("discussionFeedback")
    .where("discussionFeedback.user = :userId", { userId: user.id })
    .andWhere("discussionFeedback.discussion = :discussionId", {
      discussionId: req.params.id,
    })
    .getOne();

  if (alreadyGivenFeedback) {
    console.log("feedback", feedback);
    alreadyGivenFeedback.feedback = feedback;
    await AppDataSource.getRepository(DiscussionFeedback).save(
      alreadyGivenFeedback
    );
    res.status(200).send(alreadyGivenFeedback);
    return;
  } else {
    const discussion = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .where("discussion.id = :id", { id: req.params.id })
      .getOne();

    if (!discussion) {
      res.status(404).send("Discussion not found.");
      return;
    }

    const discussionFeedback = new DiscussionFeedback();
    discussionFeedback.discussion = discussion;
    discussionFeedback.user = user;
    discussionFeedback.feedback = feedback;

    await AppDataSource.getRepository(DiscussionFeedback).save(
      discussionFeedback
    );
    res.status(201).send(discussionFeedback);
    return;
  }
});

module.exports = router;
