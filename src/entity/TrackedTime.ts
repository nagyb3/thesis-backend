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

  // Date for when the time was tracked to
  // note: the date is not the same as the created_at column
  // users can track time to a date in the past
  @Column("date")
  date: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  created_at: Date;
}
