import * as express from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Rating } from "../entity/Rating";
import { authenticateToken } from "../middlewares/authenticateToken";

const router = express.Router();

router.get("/:id", authenticateToken, async (req, res) => {
  let user: User;
  try {
    user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.params.id })
      .getOne();
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to get the user.");
    return;
  }

  if (!user) {
    res.status(404).send("User not found.");
    return;
  }

  user.password = undefined;

  let average: number | undefined = undefined;
  let numberOfRatings: number | undefined = undefined;
  let ratingByReqUser: number | undefined = undefined;
  try {
    const ratingsForUser = await AppDataSource.getRepository(Rating)
      .createQueryBuilder("rating")
      .innerJoinAndSelect("rating.givento", "givento")
      .where("rating.givento = :id", { id: req.params.id })
      .getMany();

    average =
      ratingsForUser.reduce((acc, rating) => acc + rating.score, 0) /
      ratingsForUser.length;

    numberOfRatings = ratingsForUser.length;
  } catch (error) {
    console.log(error);
  }

  try {
    const rating = await AppDataSource.getRepository(Rating)
      .createQueryBuilder("rating")
      .where("rating.givenby = :fromUserId", { fromUserId: req.user.userId })
      .andWhere("rating.givento = :toUserId", { toUserId: req.params.id })
      .getOne();

    if (rating) {
      ratingByReqUser = rating.score;
    }
  } catch (error) {
    console.log(error);
  }

  res
    .status(200)
    .send({ user: user, rating: average, numberOfRatings, ratingByReqUser });
});

module.exports = router;
