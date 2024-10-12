import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Discussion } from "./Discusson";

@Entity()
export class DiscussionFeedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Discussion, (discussion) => discussion.discussionFeedback)
  discussion: Discussion;

  // the user who gave the feedback
  @ManyToOne(() => User, (user) => user.discussionFeedback)
  user: User;

  @Column()
  feedback: "like" | "dislike" | "none";
}
