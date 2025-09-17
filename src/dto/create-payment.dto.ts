import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  student_info?: { name: string; id: string; email: string };

  @IsOptional()
  @IsString()
  trustee_id?: string;

  @IsOptional()
  @IsString()
  custom_order_id?: string;

  @IsOptional()
  @IsString()
  callback_url?: string;
}
