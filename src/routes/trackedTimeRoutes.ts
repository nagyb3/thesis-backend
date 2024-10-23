import { Request, Response, Router } from "express";
import { authenticateToken } from "../middlewares/authenticateToken";
import { TrackedTime } from "../entity/TrackedTime";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

const router = Router();

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { minutes, date } = req.body;

    if (!minutes) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }

    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.user?.userId })
      .getOne();

    const trackedTime = new TrackedTime();

    trackedTime.user = user;
    trackedTime.minutes = Number(minutes);
    console.log("date received:", date);
    console.log("date stored:", new Date(date));

    trackedTime.date = new Date(date);

    await AppDataSource.getRepository(TrackedTime).save(trackedTime);
    res.status(201).json(trackedTime);
    return;
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "Something went wrong" });
    return;
  }
});

router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const trackedTime = await AppDataSource.getRepository(TrackedTime)
        .createQueryBuilder("trackedTime")
        .leftJoinAndSelect("trackedTime.user", "user")
        .where("trackedTime.id = :id", { id })
        .getOneOrFail();

      if (!trackedTime) {
        res.status(404).json({ message: "Tracked time not found." });
        return;
      }

      if (trackedTime?.user?.id !== req.user?.userId) {
        res.status(403).json({
          message: "You are not allowed to delete this tracked time.",
        });
        return;
      }

      console.log({ trackedTime });

      await AppDataSource.getRepository(TrackedTime).remove(trackedTime);
      res.status(204).json({ message: "Tracked time deleted." });
      return;
    } catch (error) {
      console.log({ error });
      res.status(500).json({ message: "Something went wrong" });
      return;
    }
  }
);

module.exports = router;
