import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class PrivateMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.privateMessagesSent)
  sender: User;

  @ManyToOne(() => User, (user) => user.privateMessagesReceived)
  receiver: User;

  @Column()
  message: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  created_at: Date;
}
