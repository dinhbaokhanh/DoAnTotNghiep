import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Discussion } from '../discussions/entities/discussion.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Discussion])],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
