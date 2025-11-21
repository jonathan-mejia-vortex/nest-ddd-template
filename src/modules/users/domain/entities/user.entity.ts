export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class User {
  constructor(
    private readonly _id: string,
    private _name: string,
    private readonly _authId: string,
    private _role: UserRole,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get authId(): string {
    return this._authId;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Métodos de dominio
  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    this._name = newName;
  }

  changeRole(newRole: UserRole): void {
    this._role = newRole;
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  // Factory method
  static create(
    id: string,
    name: string,
    authId: string,
    role: UserRole = UserRole.USER,
  ): User {
    if (!id || !name || !authId) {
      throw new Error('Los campos id, name y authId son requeridos');
    }
    return new User(id, name, authId, role, new Date(), new Date());
  }

  // Método para reconstruir desde persistencia
  static fromPersistence(data: {
    id: string;
    name: string;
    authId: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    return new User(
      data.id,
      data.name,
      data.authId,
      data.role as UserRole,
      data.createdAt,
      data.updatedAt,
    );
  }
}

