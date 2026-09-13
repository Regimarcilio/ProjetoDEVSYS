import { IsEnum } from 'class-validator';
import { CategoryStatus } from '@prisma/client';

export class UpdateCategoryStatusDto {
  @IsEnum(CategoryStatus)
  status!: CategoryStatus;
}
