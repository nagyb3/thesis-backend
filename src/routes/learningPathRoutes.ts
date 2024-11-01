import * as express from "express";
import { AppDataSource } from "../data-source";
import { LearningPath } from "../entity/LearningPath";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const learningPathId = req.params.id;
    console.log(learningPathId);

    const learningPath = await AppDataSource.getRepository(LearningPath)
      .createQueryBuilder("learningPath")
      .leftJoinAndSelect("learningPath.author", "author")
      .leftJoinAndSelect("learningPath.topic", "topic")
      .where("learningPath.id = :id", { id: learningPathId })
      .getOne();

    if (!learningPath) {
      res.status(404).send("Learning path not found.");
      return;
    }

    res.status(200).send(learningPath);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to get the learning path.");
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const learningPathId = req.params.id;

    const learningPath = await AppDataSource.getRepository(LearningPath)
      .createQueryBuilder("learningPath")
      .leftJoinAndSelect("learningPath.author", "author")
      .where("learningPath.id = :id", { id: learningPathId })
      .getOne();

    if (!learningPath) {
      res.status(404).send("Learning path not found.");
      return;
    }

    if (learningPath.author.id !== req.user.userId) {
      res.status(403).send("You are not the author of this learning path.");
      return;
    }

    await AppDataSource.getRepository(LearningPath).remove(learningPath);

    res.status(200).send({
      message: "Learning path deleted successfully.",
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to delete the learning path.");
  }
});

module.exports = router;
