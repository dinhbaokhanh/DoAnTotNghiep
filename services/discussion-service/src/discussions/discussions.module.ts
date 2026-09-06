import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discussion } from './entities/discussion.entity';
import { DiscussionMedia } from './entities/discussion-media.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Comment } from '../comments/entities/comment.entity';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Discussion, DiscussionMedia, Tag, Comment])],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService], // Export để Phase 3 (Comments) có thể inject
})
export class DiscussionsModule {}
