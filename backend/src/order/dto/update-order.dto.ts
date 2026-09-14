import {
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;
}
