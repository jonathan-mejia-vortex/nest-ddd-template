import { Auth } from './auth.entity';

describe('Auth Entity', () => {
  describe('create', () => {
    it('should create an auth with valid data', () => {
      const auth = Auth.create('test-id', 'test@example.com', 'hashed-password');

      expect(auth).toBeInstanceOf(Auth);
      expect(auth.id).toBe('test-id');
      expect(auth.email).toBe('test@example.com');
      expect(auth.password).toBe('hashed-password');
    });

    it('should throw error when id is empty', () => {
      expect(() => {
        Auth.create('', 'test@example.com', 'hashed-password');
      }).toThrow('Los campos id, email y password son requeridos');
    });

    it('should throw error when email is empty', () => {
      expect(() => {
        Auth.create('test-id', '', 'hashed-password');
      }).toThrow('Los campos id, email y password son requeridos');
    });

    it('should throw error when password is empty', () => {
      expect(() => {
        Auth.create('test-id', 'test@example.com', '');
      }).toThrow('Los campos id, email y password son requeridos');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', () => {
      const auth = Auth.create('test-id', 'test@example.com', 'old-password');
      
      auth.changePassword('new-password');
      
      expect(auth.password).toBe('new-password');
    });

    it('should throw error when new password is empty', () => {
      const auth = Auth.create('test-id', 'test@example.com', 'old-password');
      
      expect(() => {
        auth.changePassword('');
      }).toThrow('El password no puede estar vacío');
    });
  });

  describe('fromPersistence', () => {
    it('should create auth from persistence data', () => {
      const auth = Auth.fromPersistence({
        id: 'test-id',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(auth).toBeInstanceOf(Auth);
      expect(auth.id).toBe('test-id');
      expect(auth.email).toBe('test@example.com');
    });
  });
});

