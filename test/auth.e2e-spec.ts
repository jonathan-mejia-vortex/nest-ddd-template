import * as request from 'supertest';
import { app } from './test-setup';

describe('AuthController (e2e)', () => {
  describe('/auth/signup (POST)', () => {
    it('Created', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'test@gmail.com', password: 'test123123', name: 'eze' })
        .expect(201);
    });
    it('Email must be unique', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'test@gmail.com', password: 'test123123', name: 'eze' })
        .expect(409);
    });
    it("Name can't be empty", () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'test@gmail.com', password: 'test123123' })
        .expect(400);
    });
    it('Password to short', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'test@gmail.com', password: '123', name: 'eze' })
        .expect(400);
    });
  });
  describe('/auth/login (POST)', () => {
    it('Success', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: 'test123123' })
        .expect(200);
    });
    it('Email not found', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'another_test_email@gmail.com', password: 'test123123' })
        .expect(401);
    });
    it('Wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: 'wrong_password' })
        .expect(401);
    });
    it("Password can't be empty", () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@gmail.com', password: '' })
        .expect(401);
    });
  });
});
