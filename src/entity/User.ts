import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Topic } from "./Topic";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @Column()
  username: string;

  @Column()
  password: string; // hashed password

  @ManyToMany(() => Topic, (topic) => topic.moderators)
  topics: Topic[];
}
