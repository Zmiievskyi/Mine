import { IsString, IsOptional, Matches } from 'class-validator';

export class AssignNodeDto {
  @IsString()
  @Matches(/^gonka1[a-z0-9]{38,}$/, {
    message: 'Node address must be a valid Gonka address (starts with gonka1)',
  })
  nodeAddress: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  gpuType?: string;

  @IsOptional()
  @IsString()
  gcoreInstanceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
