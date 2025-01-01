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
import { DiscussionFeedback } from "./DiscussionFeedback";

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

  @OneToMany(
    () => DiscussionFeedback,
    (discussionFeedback) => discussionFeedback.discussion
  )
  discussionFeedback: DiscussionFeedback[];

  // url of the image for the discussion
  @Column({ nullable: true })
  image?: string;

  // url of the video for the discussion
  @Column({ nullable: true })
  video?: string;
}
