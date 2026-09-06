import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO cho việc cập nhật tag.
 * Tất cả các field đều là optional (partial update).
 */
export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
