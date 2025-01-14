import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Discussion } from "./Discusson";
import { User } from "./User";
import { Topic } from "./Topic";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  content: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.comments)
  author: User;

  @ManyToOne(() => Discussion, (discussion) => discussion.comments, {
    onDelete: "CASCADE",
  })
  discussion: Discussion;

  @ManyToOne(() => Topic, (topic) => topic.comments, {
    onDelete: "CASCADE",
  })
  topic: Topic;
}
