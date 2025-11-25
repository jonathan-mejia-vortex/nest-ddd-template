import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

export class UserCreationFailedException extends DomainException {
  constructor(reason?: string) {
    super(
      'USER_CREATION_FAILED',
      reason ? `Error al crear usuario: ${reason}` : 'Error al crear usuario',
    );
  }
}
