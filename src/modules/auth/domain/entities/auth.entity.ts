export class Auth {
  constructor(
    private readonly _id: string,
    private readonly _email: string,
    private _password: string,
    private readonly _createdAt?: Date,
    private readonly _updatedAt?: Date,
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Métodos de dominio
  changePassword(newPassword: string): void {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    this._password = newPassword;
  }

  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this._email);
  }

  // Factory method
  static create(id: string, email: string, hashedPassword: string): Auth {
    if (!id || !email || !hashedPassword) {
      throw new Error('Los campos id, email y password son requeridos');
    }
    
    const auth = new Auth(id, email, hashedPassword, new Date(), new Date());
    
    if (!auth.validateEmail()) {
      throw new Error('Formato de email inválido');
    }
    
    return auth;
  }

  // Método para reconstruir desde persistencia
  static fromPersistence(data: {
    id: string;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Auth {
    return new Auth(
      data.id,
      data.email,
      data.password,
      data.createdAt,
      data.updatedAt,
    );
  }
}

