import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { Discussion } from '../discussions/entities/discussion.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CastVoteDto } from './dto/cast-vote.dto';
import { TargetType } from './enums/target-type.enum';
import { VoteType } from './enums/vote-type.enum';
import { GatewayUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(Discussion)
    private readonly discussionRepo: Repository<Discussion>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  // ===== CAST VOTE (toggle logic) =====

  /**
   * Vote / Toggle / Đổi vote cho Discussion hoặc Comment.
   *
   * 3 kịch bản:
   * A) Chưa vote       → tạo mới, tăng counter
   * B) Cùng loại vote  → toggle off (xóa), giảm counter
   * C) Khác loại vote  → đổi vote, cập nhật 2 counter
   */
  async castVote(
    targetType: TargetType,
    targetId: string,
    user: GatewayUser,
    dto: CastVoteDto,
  ): Promise<{ action: string; voteType?: VoteType }> {
    if (!user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // 1. Validate target tồn tại (soft-deleted records tự động bị exclude)
    await this.validateTargetExists(targetType, targetId);

    // 2. Tìm vote hiện tại của user cho target này
    const existingVote = await this.voteRepo.findOneBy({
      userId: user.id,
      targetType,
      targetId,
    });

    // Kịch bản A — Chưa vote → tạo mới
    if (!existingVote) {
      await this.voteRepo.save(
        this.voteRepo.create({
          userId: user.id,
          targetType,
          targetId,
          voteType: dto.voteType,
        }),
      );
      await this.updateCounter(targetType, targetId, dto.voteType, +1);
      return { action: 'voted', voteType: dto.voteType };
    }

    // Kịch bản B — Cùng loại → toggle off (xóa vote)
    if (existingVote.voteType === dto.voteType) {
      await this.voteRepo.remove(existingVote);
      await this.updateCounter(targetType, targetId, dto.voteType, -1);
      return { action: 'unvoted' };
    }

    // Kịch bản C — Khác loại → đổi vote
    const oldVoteType = existingVote.voteType;
    existingVote.voteType = dto.voteType;
    await this.voteRepo.save(existingVote);
    await this.updateCounter(targetType, targetId, oldVoteType, -1);
    await this.updateCounter(targetType, targetId, dto.voteType, +1);
    return { action: 'changed', voteType: dto.voteType };
  }

  // ===== REMOVE VOTE (explicit) =====

  /**
   * Hủy vote — dùng khi user bấm nút "Bỏ vote" mà không cần biết loại vote hiện tại.
   */
  async removeVote(
    targetType: TargetType,
    targetId: string,
    user: GatewayUser,
  ): Promise<{ action: string }> {
    if (!user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const existingVote = await this.voteRepo.findOneBy({
      userId: user.id,
      targetType,
      targetId,
    });

    if (!existingVote) {
      throw new NotFoundException('Vote not found');
    }

    await this.updateCounter(targetType, targetId, existingVote.voteType, -1);
    await this.voteRepo.remove(existingVote);
    return { action: 'unvoted' };
  }

  // ===== Helpers =====

  /**
   * Kiểm tra target (discussion hoặc comment) tồn tại.
   * TypeORM tự exclude soft-deleted records → không thể vote bài/comment đã xóa.
   */
  private async validateTargetExists(
    targetType: TargetType,
    targetId: string,
  ): Promise<void> {
    let exists = false;

    if (targetType === TargetType.DISCUSSION) {
      exists = await this.discussionRepo.existsBy({ id: targetId });
    } else {
      exists = await this.commentRepo.existsBy({ id: targetId });
    }

    if (!exists) {
      const label =
        targetType === TargetType.DISCUSSION ? 'Discussion' : 'Comment';
      throw new NotFoundException(`${label} not found`);
    }
  }

  /**
   * Cập nhật upvote_count hoặc downvote_count trên bảng target.
   *
   * delta > 0 → tăng counter
   * delta < 0 → giảm counter (dùng GREATEST tránh âm)
   */
  private async updateCounter(
    targetType: TargetType,
    targetId: string,
    voteType: VoteType,
    delta: number,
  ): Promise<void> {
    const column =
      voteType === VoteType.UPVOTE ? 'upvote_count' : 'downvote_count';

    const repo =
      targetType === TargetType.DISCUSSION
        ? this.discussionRepo
        : this.commentRepo;

    const expression =
      delta > 0
        ? `${column} + 1`
        : `GREATEST(${column} - 1, 0)`;

    await repo
      .createQueryBuilder()
      .update()
      .set({ [column === 'upvote_count' ? 'upvoteCount' : 'downvoteCount']: () => expression })
      .where('id = :id', { id: targetId })
      .execute();
  }
}
