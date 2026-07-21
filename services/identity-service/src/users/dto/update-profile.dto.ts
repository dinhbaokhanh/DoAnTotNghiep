import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn B' })
  // Strip HTML tags và trim whitespace trước khi validate.
  // Ngăn stored XSS: "<script>alert(1)</script>" → "" sẽ fail @IsNotEmpty().
  // Ngăn HTML injection: "<b>Name</b>" → "Name" — chỉ lưu text thuần.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value,
  )
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: '1999-05-20' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
