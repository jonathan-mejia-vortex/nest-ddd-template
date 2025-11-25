import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(id?: string) {
    super(
      'USER_NOT_FOUND',
      id ? `Usuario con id ${id} no encontrado` : 'Usuario no encontrado',
    );
  }
}
