import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Discussion } from "./Discusson";
import { Comment } from "./Comment";
import { LearningPath } from "./LearningPath";

@Entity()
export class Topic {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({
    default: "",
  })
  description?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @ManyToMany(() => User, (user) => user.topics)
  @JoinTable()
  moderators: User[];

  @OneToMany(() => Discussion, (discussion) => discussion.topic)
  discussions: Discussion[];

  @OneToMany(() => Comment, (comment) => comment.topic)
  comments: Comment[];

  @Column("simple-array", { default: "" })
  learningResources: string[] = [];

  @OneToMany(() => LearningPath, (learningPath) => learningPath.topic)
  learningPaths: LearningPath[];
}
