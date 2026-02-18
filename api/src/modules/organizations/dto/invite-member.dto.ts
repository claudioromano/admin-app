import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole = MemberRole.MEMBER;
}
