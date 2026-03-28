import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { userModel } from '../src/models/user.model.js';
import redis from '../src/db/redis.js';

jest.setTimeout(60000);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'testsecret';

  await mongoose.connect(uri, { dbName: 'auth-test' });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();

  if (redis?.quit) await redis.quit();
});

beforeEach(async () => {
  await userModel.deleteMany({});
});

const createUserAndToken = async () => {
  const user = await userModel.create({
    username: 'logout_user',
    email: 'logout@example.com',
    password: 'hashed-password',
    fullName: { firstName: 'Logout', lastName: 'User' },
  });

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { token };
};

describe('/api/auth/logout', () => {

  it('logs out an authenticated user', async () => {
    const { token } = await createUserAndToken();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`token=${token}`])
      .expect(200);

    expect(res.body.message).toBe('User logged out successfully');

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    expect(
      setCookie.some(cookie =>
        cookie.toLowerCase().startsWith('token=;')
      )
    ).toBe(true);
  });

  // ❌ NO TOKEN
  it('rejects logout attempts without token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expect(res.body.error).toBe('Authentication required');
  });

  it('still logs out even with invalid token (decode does not validate)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['token=invalid'])
      .expect(200); 

    expect(res.body.message).toBe('User logged out successfully');

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    expect(
      setCookie.some(cookie =>
        cookie.toLowerCase().startsWith('token=;')
      )
    ).toBe(true);
  });

});