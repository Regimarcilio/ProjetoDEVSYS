import {
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  companyId!: string;

  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
