import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Topic } from "./Topic";
import { Discussion } from "./Discusson";
import { Comment } from "./Comment";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  username: string;

  @Column()
  password: string; // hashed password

  @ManyToMany(() => Topic, (topic) => topic.moderators)
  topics: Topic[];

  @OneToMany(() => Discussion, (discussion) => discussion.author)
  discussions: Discussion[];

  @ManyToOne(() => User, (user) => user.comments)
  comments: Comment[];
}
