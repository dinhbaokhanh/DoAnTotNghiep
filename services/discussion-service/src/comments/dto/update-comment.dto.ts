import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
