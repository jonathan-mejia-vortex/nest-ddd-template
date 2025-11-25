import { User } from './user.entity';
import { UserRole } from '../../../../common/types';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('test-id');
      expect(user.name).toBe('John Doe');
      expect(user.authId).toBe('auth-id');
      expect(user.role).toBe(UserRole.USER);
    });

    it('should throw error when id is empty', () => {
      expect(() => {
        User.create('', 'John Doe', 'auth-id', UserRole.USER);
      }).toThrow('Los campos id, name y authId son requeridos');
    });

    it('should throw error when name is empty', () => {
      expect(() => {
        User.create('test-id', '', 'auth-id', UserRole.USER);
      }).toThrow('Los campos id, name y authId son requeridos');
    });

    it('should throw error when authId is empty', () => {
      expect(() => {
        User.create('test-id', 'John Doe', '', UserRole.USER);
      }).toThrow('Los campos id, name y authId son requeridos');
    });
  });

  describe('changeName', () => {
    it('should change user name successfully', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      user.changeName('Jane Doe');

      expect(user.name).toBe('Jane Doe');
    });

    it('should throw error when new name is empty', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      expect(() => {
        user.changeName('');
      }).toThrow('El nombre no puede estar vacío');
    });

    it('should throw error when new name is only whitespace', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      expect(() => {
        user.changeName('   ');
      }).toThrow('El nombre no puede estar vacío');
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      user.changeRole(UserRole.ADMIN);

      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      const user = User.create(
        'test-id',
        'John Doe',
        'auth-id',
        UserRole.ADMIN,
      );

      expect(user.isAdmin()).toBe(true);
    });

    it('should return false for non-admin users', () => {
      const user = User.create('test-id', 'John Doe', 'auth-id', UserRole.USER);

      expect(user.isAdmin()).toBe(false);
    });
  });

  describe('fromPersistence', () => {
    it('should create user from persistence data', () => {
      const user = User.fromPersistence({
        id: 'test-id',
        name: 'John Doe',
        authId: 'auth-id',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('test-id');
      expect(user.name).toBe('John Doe');
    });
  });
});
