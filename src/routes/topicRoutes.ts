import * as express from "express";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";
import { authenticateToken } from "../middlewares/authenticateToken";
import { User } from "../entity/User";
import { Discussion } from "../entity/Discusson";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).send("Please provide the name for the new topic.");
    return;
  }

  const topic = new Topic();

  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.user.userId })
      .getOneOrFail();
    topic.moderators = [user];
  } catch (error) {
    console.error(error);
    res.status(500).send("user not found.");
    return;
  }

  topic.name = name;
  topic.description = description ?? "";

  try {
    await AppDataSource.getRepository(Topic).save(topic);
    res.status(201).send(topic);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create the topic.");
    return;
  }
});

router.get("/", async (req, res) => {
  try {
    const nameSearchParam = req.query.name;

    const topics = await AppDataSource.getRepository(Topic)
      .createQueryBuilder("topic")
      .where("topic.name ILIKE :name", { name: `%${nameSearchParam}%` })
      .orderBy("topic.created_at", "DESC")
      .getMany();

    res.send(topics);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to get the topics.");
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const topic = await AppDataSource.getRepository(Topic)
    .createQueryBuilder("topic")
    .leftJoinAndSelect("topic.moderators", "moderators")
    .leftJoinAndSelect("topic.discussions", "discussions")
    .select(["topic", "discussions", "moderators.username", "moderators.id"])
    .where("topic.id = :id", { id })
    .getOne();

  if (!topic) {
    res.status(404).send("Topic not found.");
    return;
  }

  res.send(topic);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: req.user.userId })
    .getOne();

  const topic = await AppDataSource.getRepository(Topic)
    .createQueryBuilder("topic")
    .leftJoinAndSelect("topic.moderators", "moderators")
    .leftJoinAndSelect("topic.discussions", "discussions")
    .where("topic.id = :id", { id: req.params.id })
    .getOne();

  const isUserModerator = topic.moderators.some(
    (moderator) => moderator.id === user.id
  );

  if (!isUserModerator) {
    res.status(403).json("You are not a moderator of this topic.");
    return;
  } else {
    for (const discussion of topic.discussions) {
      await AppDataSource.getRepository(Discussion).delete(discussion.id);
    }

    await AppDataSource.getRepository(Topic).delete(topic.id);
    res.status(200).json({ message: "Topic has been successfully deleted." });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400).json("Please provide the name for the new topic.");
    return;
  }

  const topic = await AppDataSource.getRepository(Topic)
    .createQueryBuilder("topic")
    .leftJoinAndSelect("topic.moderators", "moderators")
    .where("topic.id = :id", { id })
    .getOne();

  const isModerator = topic.moderators.some(
    (moderator) => moderator.id === req.user.userId
  );

  if (!isModerator) {
    res.status(403).json("You are not a moderator of this topic.");
    return;
  }

  topic.name = name;
  topic.description = description;

  try {
    await AppDataSource.getRepository(Topic).save(topic);
    res.status(200).send(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json("Failed to save updated topic.");
  }
});

router.get("/:id/discussions", async (req, res) => {
  const { id } = req.params;

  const searchParam = req.query.search;

  try {
    const discussions = await AppDataSource.getRepository(Discussion)
      .createQueryBuilder("discussion")
      .innerJoinAndSelect("discussion.topic", "topic")
      .where("discussion.title ILIKE :search", { search: `%${searchParam}%` })
      .andWhere("discussion.topic = :id", { id })
      .getMany();

    res.status(200).json(discussions);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json("Failed to get the discussions.");
  }
});

router.post("/:id/discussions", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    res
      .status(400)
      .send("Please provide the title and content for the discussion.");
    return;
  }

  const discussion = new Discussion();
  discussion.title = title;
  discussion.content = content;
  discussion.comments = [];

  try {
    const topic = await AppDataSource.getRepository(Topic)
      .createQueryBuilder("topic")
      .where("topic.id = :id", { id })
      .getOneOrFail();
    discussion.topic = topic;
  } catch (error) {
    console.error(error);
    res.status(500).json("Failed to get the topic.");
    return;
  }

  try {
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.user.userId })
      .getOneOrFail();
    discussion.author = user;
  } catch (error) {
    console.error(error);
    res.status(500).json("Failed to get the user.");
    return;
  }

  try {
    await AppDataSource.getRepository(Discussion).save(discussion);
    res.status(201).json(discussion);
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong while saving new discussion.");
  }
});

module.exports = router;
