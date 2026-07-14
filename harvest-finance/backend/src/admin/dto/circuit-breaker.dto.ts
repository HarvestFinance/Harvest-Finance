import { IsOptional, IsString, Length } from 'class-validator';

export class CircuitBreakerActionDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
