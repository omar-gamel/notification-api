import { SetMetadata } from '@nestjs/common';

export const HasPermission = (...args: string[]) => SetMetadata('permissions', args);
