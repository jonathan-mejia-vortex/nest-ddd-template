import { SetMetadata } from '@nestjs/common';
import { ROLE } from '../../common/types';

export const Roles = (roles: ROLE[]) => SetMetadata('roles', roles);
