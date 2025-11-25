import { SetMetadata } from "@nestjs/common";
import type { ROLE } from "../../common/types";

export const Roles = (roles: ROLE[]) => SetMetadata("roles", roles);
