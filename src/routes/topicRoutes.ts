import * as express from "express";
import { Topic } from "../entity/Topic";
import { AppDataSource } from "../data-source";
import { authenticateToken } from "../middlewares/authenticateToken";
import { User } from "../entity/User";
import { Discussion } from "../entity/Discusson";
import * as sharp from "sharp";
import { LearningPath } from "../entity/LearningPath";

const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).send("Missing topic name.");
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
    res.status(500).send("User not found.");
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

router.get("/", authenticateToken, async (req, res) => {
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
    .leftJoinAndSelect("topic.learningPaths", "learningPaths")
    .leftJoinAndSelect("learningPaths.author", "learningPathsAuthor")
    .leftJoinAndSelect("topic.discussions", "discussions")
    .leftJoinAndSelect("discussions.author", "discussionsAuthor")
    .select([
      "topic",
      "discussions",
      "moderators.username",
      "moderators.id",
      "learningPaths",
      "learningPathsAuthor.username",
      "learningPathsAuthor.id",
      "discussionsAuthor.username",
      "discussionsAuthor.id",
    ])
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
  const { name, description, learningResources } = req.body;

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

  topic.name = name ?? topic.name;
  topic.description = description ?? topic.description;
  topic.learningResources = learningResources ?? topic.learningResources;

  try {
    await AppDataSource.getRepository(Topic).save(topic);
    res.status(200).send(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json("Failed to save updated topic.");
  }
});

router.get("/:id/discussions", authenticateToken, async (req, res) => {
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
  const { title, content, image, video } = req.body;

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

  let imageUrl = undefined;
  try {
    if (image) {
      const imageData = image.split(";base64,").pop();
      const buffer = Buffer.from(imageData, "base64");
      const webpBuffer = await sharp(buffer).toFormat("webp").toBuffer();
      imageUrl = await s3
        .upload({
          Body: webpBuffer,
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `discussion-images/${new Date().toISOString()}.webp`,
        })
        .promise();
      discussion.image = imageUrl.Location;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong.");
    return;
  }

  let videoUrl = undefined;
  try {
    if (video) {
      const videoData = video.split(";base64,").pop();
      const buffer = Buffer.from(videoData, "base64");
      videoUrl = await s3
        .upload({
          Body: buffer,
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `discussion-videos/${new Date().toISOString()}.webm`,
        })
        .promise();
      discussion.video = videoUrl.Location;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong.");
    return;
  }

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

router.post("/:id/learning-paths", authenticateToken, async (req, res) => {
  if (!req.body.title || !req.body.items) {
    res.status(400).send("Please provide all required fields.");
    return;
  }

  try {
    const topic = await AppDataSource.getRepository(Topic)
      .createQueryBuilder("topic")
      .where("topic.id = :id", { id: req.params.id })
      .getOneOrFail();

    let learningPath = new LearningPath();
    learningPath.title = req.body.title;
    learningPath.items = req.body.items;
    learningPath.topic = topic;
    learningPath.author = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.user.userId })
      .getOneOrFail();

    learningPath = await AppDataSource.getRepository(LearningPath).save(
      learningPath
    );

    res.status(201).json(learningPath);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to save the learning path.");
  }
});

router.get("/:id/learning-paths", authenticateToken, async (req, res) => {
  try {
    const learningPaths = await AppDataSource.getRepository(LearningPath)
      .createQueryBuilder("learningPath")
      .where("learningPath.topic = :id", { id: req.params.id })
      .getMany();
    res.status(200).json(learningPaths);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get the learning paths.");
  }
});

module.exports = router;
