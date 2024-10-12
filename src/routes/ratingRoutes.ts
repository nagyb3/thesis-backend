import * as express from "express";
import { Rating } from "../entity/Rating";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const fromUserId = req.user.userId;

  if (!req.body.toUser || !req.body.score) {
    res.status(400).send("Please provide all required fields.");
    return;
  }

  // check for existing rating -> update that one
  try {
    const existingRating = await AppDataSource.getRepository(Rating)
      .createQueryBuilder("rating")
      .where("rating.givenby = :fromUserId", { fromUserId })
      .andWhere("rating.givento = :toUserId", { toUserId: req.body.toUser })
      .getOne();

    if (existingRating) {
      existingRating.score = req.body.score;
      await AppDataSource.getRepository(Rating).save(existingRating);

      res.status(200).send(existingRating);

      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to update the rating.");
    return;
  }

  // if no rating exists yet -> create new one
  try {
    const fromUser = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: fromUserId })
      .getOneOrFail();

    const toUser = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.body.toUser })
      .getOneOrFail();

    const rating = new Rating();

    rating.score = req.body.score;
    rating.givenby = fromUser;
    rating.givento = toUser;

    await AppDataSource.getRepository(Rating).save(rating);
    res.status(201).send(rating);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to save the rating.");
  }
});

module.exports = router;
