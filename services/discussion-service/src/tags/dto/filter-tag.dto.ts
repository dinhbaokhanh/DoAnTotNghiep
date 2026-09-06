import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class FilterTagDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
