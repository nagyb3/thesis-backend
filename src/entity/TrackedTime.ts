import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class TrackedTime {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.trackedTimes)
  user: User;

  @Column()
  minutes: number;

  @Column("date")
  date: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}
