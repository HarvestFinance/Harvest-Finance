import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'User email address (must be unique)',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number with country code',
  })
  @IsString({ message: 'Phone number must be a string' })
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Farm Road, Agriculture City, AC 12345',
    description: 'Physical address',
  })
  @IsString({ message: 'Address must be a string' })
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/profile-image.jpg',
    description: 'URL to profile image',
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsOptional()
  profile_image_url?: string;

  @ApiPropertyOptional({
    example: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    description: 'Stellar blockchain address',
  })
  @IsString({ message: 'Stellar address must be a string' })
  @MaxLength(56, { message: 'Stellar address must not exceed 56 characters' })
  @IsOptional()
  stellar_address?: string;
}
