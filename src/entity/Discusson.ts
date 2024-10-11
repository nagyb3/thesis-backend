import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Topic } from "./Topic";
import { Comment } from "./Comment";

@Entity()
export class Discussion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.discussions)
  author: User;

  @ManyToOne(() => Topic, (topic) => topic.discussions)
  topic: Topic;

  @OneToMany(() => Comment, (comment) => comment.discussion)
  comments: Comment[];
}
