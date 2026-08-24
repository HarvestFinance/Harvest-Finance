import { IsIn, IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class MigratePositionDto {
  @IsString()
  @IsNotEmpty()
  sourceChain: string;

  @IsString()
  @IsNotEmpty()
  sourcePositionId: string;

  @IsString()
  @IsNotEmpty()
  destinationChain: string;

  @IsString()
  @IsNotEmpty()
  destinationPositionId: string;

  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  sourceAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsIn(['base64', 'hex'])
  signatureEncoding: 'base64' | 'hex' = 'base64';
}
