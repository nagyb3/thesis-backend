import { Request, Response } from "express";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authenticateToken } from "../middlewares/authenticateToken";

const express = require("express");

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  // check if username is already used
  try {
    const user = await AppDataSource.manager
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.username = :username", { username })
      .getOne();

    if (user) {
      return res.status(400).json({ message: "Username already used" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }

  const user = new User();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;
  user.username = username;

  try {
    await AppDataSource.manager.getRepository(User).save(user);

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("Please provide all required fields");
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const user = await AppDataSource.manager
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.username = :username", { username })
      .getOneOrFail();

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Passwords did not match");
      res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = await AppDataSource.manager
        .getRepository(User)
        .createQueryBuilder("user")
        .where("user.id = :id", { id: req.user.userId })
        .getOneOrFail();

      user.password = undefined;

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(404).send("User not found");
    }
  }
);

module.exports = router;
