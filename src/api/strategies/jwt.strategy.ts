import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from '../../config/envs';
import { GetAuthByIdUseCase } from '../../modules/auth/application/use-cases/get-auth-by-id.use-case';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly getAuthByIdUseCase: GetAuthByIdUseCase) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwtSecret,
    });
  }

  async validate(payload: any) {
    const auth = await this.getAuthByIdUseCase.execute(payload.authId);
    return {
      id: payload.userId,
      authId: payload.authId,
      role: payload.role,
    };
  }
}

