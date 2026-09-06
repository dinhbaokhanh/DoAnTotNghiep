import { IsEnum } from 'class-validator';
import { VoteType } from '../enums/vote-type.enum';

/**
 * DTO cho POST vote endpoint.
 * Chỉ cần voteType — targetType và targetId lấy từ URL params.
 *
 * Ví dụ: POST /discussions/uuid/vote  { "voteType": "upvote" }
 */
export class CastVoteDto {
  @IsEnum(VoteType, { message: 'voteType phải là upvote hoặc downvote' })
  voteType: VoteType;
}
