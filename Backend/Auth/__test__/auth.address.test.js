import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { userModel } from '../src/models/user.model.js';

jest.setTimeout(60000);

let mongo;
let testUser;
let validToken;

beforeAll(async () => {
  // 1. Setup in-memory MongoDB
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'testsecret';

  await mongoose.connect(uri, { dbName: 'user-address-test' });
});

afterAll(async () => {
  // 2. Teardown and cleanup
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  // 3. Clear the database and set up a fresh test user before each test
  await userModel.deleteMany({});
  
  testUser = await userModel.create({
    username: 'test_user',
    email: 'test@example.com',
    password: 'Password123!',
    fullName: { firstName: 'Test', lastName: 'User' },
    addresses: [
      {
        street: '123 Old St',
        city: 'Old City',
        state: 'OC',
        zipCode: '12345',
        country: 'Old Country'
      }
    ]
  });

  // Generate a valid JWT token for the auth middleware
  validToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
});

describe('User Addresses API', () => {

  // ==========================================
  // GET /api/user/me/addresses
  // ==========================================
  describe('GET /api/user/me/addresses', () => {
    it('fetches user addresses successfully', async () => {
      const res = await request(app)
        .get('/api/user/me/addresses')
        .set('Cookie', [`token=${validToken}`])
        .expect(200);

      expect(res.body.message).toBe('Addresses fetched successfully');
      expect(res.body.addresses).toBeDefined();
      expect(res.body.addresses.length).toBe(1);
      expect(res.body.addresses[0].street).toBe('123 Old St');
    });

    it('rejects the request if no token is provided', async () => {
      const res = await request(app)
        .get('/api/user/me/addresses')
        .expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });

  // ==========================================
  // POST /api/user/me/addresses
  // ==========================================
  describe('POST /api/user/me/addresses', () => {
    it('adds a new address successfully', async () => {
      const newAddress = {
        street: '456 New Ave',
        city: 'New City',
        state: 'NC',
        zipCode: '67890',
        country: 'New Country'
      };

      const res = await request(app)
        .post('/api/user/me/addresses')
        .set('Cookie', [`token=${validToken}`])
        .send(newAddress)
        .expect(201);

      expect(res.body.message).toBe('Address added successfully');
      expect(res.body.addresses).toBeDefined();
      expect(res.body.addresses.length).toBe(2); // The old one + the new one
      
      const addedAddress = res.body.addresses.find(a => a.street === '456 New Ave');
      expect(addedAddress).toBeDefined();
      expect(addedAddress.city).toBe('New City');
    });

    it('rejects if address payload is missing required fields', async () => {
      const invalidAddress = {
        street: '456 Missing Fields St'
        // Missing city, state, zipCode, country
      };

      const res = await request(app)
        .post('/api/user/me/addresses')
        .set('Cookie', [`token=${validToken}`])
        .send(invalidAddress)
        .expect(400);

      // Note: If `addUserAddressValidator` intercepts this, the error structure 
      // might vary, but the status code should definitely be 400.
      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // DELETE /api/user/me/addresses/:addressId
  // ==========================================
  describe('DELETE /api/user/me/addresses/:addressId', () => {
    it('deletes an address successfully', async () => {
      // First, get the ID of the pre-existing address from the testUser
      const addressId = testUser.addresses[0]._id;

      const res = await request(app)
        .delete(`/api/user/me/addresses/${addressId}`)
        .set('Cookie', [`token=${validToken}`])
        .expect(200);

      expect(res.body.message).toBe('Address deleted successfully');
      expect(res.body.addresses.length).toBe(0);

      // Verify it's gone from the database
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.addresses.length).toBe(0);
    });

    it('returns 404 if the address ID does not exist', async () => {
      // Generate a random, valid-looking MongoDB ObjectId
      const fakeAddressId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/user/me/addresses/${fakeAddressId}`)
        .set('Cookie', [`token=${validToken}`])
        .expect(404);

      expect(res.body.error).toBe('Address not found');
    });
  });
});