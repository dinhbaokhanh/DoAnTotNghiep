import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { TargetType } from '../enums/target-type.enum';
import { VoteType } from '../enums/vote-type.enum';

/**
 * Vote entity — lưu trữ upvote/downvote cho cả Discussion lẫn Comment.
 * Dùng chung 1 bảng với target_type phân biệt loại target.
 *
 * Unique constraint (user_id, target_type, target_id) đảm bảo
 * mỗi user chỉ có 1 vote trên 1 target ở tầng database.
 */
@Entity('votes')
@Unique(['userId', 'targetType', 'targetId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'target_type', type: 'enum', enum: TargetType })
  targetType: TargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'vote_type', type: 'enum', enum: VoteType })
  voteType: VoteType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
