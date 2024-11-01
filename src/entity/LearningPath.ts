import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Topic } from "./Topic";
import { User } from "./User";

@Entity()
export class LearningPath {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.learningPaths)
  author: User;

  @Column({ type: "jsonb" })
  items: { title: string; id: string }[];

  @ManyToOne(() => Topic, (topic) => topic.learningPaths, {
    onDelete: "CASCADE",
  })
  topic: Topic;
}
