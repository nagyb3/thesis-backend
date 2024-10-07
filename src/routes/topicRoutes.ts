import * as express from "express";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";
import { authenticateToken } from "../middlewares/authenticateToken";
import { User } from "../entity/User";

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
  const topics = await AppDataSource.getRepository(Topic).find();

  res.send(topics);
});

router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const topic = await AppDataSource.getRepository(Topic)
    .createQueryBuilder("topic")
    .leftJoinAndSelect("topic.moderators", "moderators")
    .select(["topic", "moderators.username", "moderators.id"])
    .where("topic.id = :id", { id })
    .getOne();

  if (!topic) {
    res.status(404).send("Topic not found.");
    return;
  }

  res.send(topic);
});

module.exports = router;
