import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Member } from '@prisma/client';

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Member => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Member;
  },
);
