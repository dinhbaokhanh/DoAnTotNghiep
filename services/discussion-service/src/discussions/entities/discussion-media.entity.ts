import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Discussion } from './discussion.entity';

/**
 * DiscussionMedia là bảng trung gian liên kết Discussion với file media.
 * mediaId tham chiếu đến Media Service (không có FK trực tiếp vì khác database).
 * Discussion Service chỉ lưu ID, không lưu nội dung file.
 */
@Entity('discussion_media')
export class DiscussionMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Discussion, (d) => d.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Discussion;

  @Column({ name: 'discussion_id', type: 'uuid' })
  discussionId: string;

  // Tham chiếu đến Media Service — chỉ lưu ID
  @Column({ name: 'media_id', type: 'uuid' })
  mediaId: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
