import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  constructor(entity: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${entity} con id ${id} no encontrado` : `${entity} no encontrado`,
    );
  }
}
