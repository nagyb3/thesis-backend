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
}
