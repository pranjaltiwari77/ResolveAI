const bcrypt = require('bcrypt');
const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/authRoutes');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

process.env.JWT_SECRET = 'testsecret';
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication', () => {
  let org;

  beforeEach(async () => {
    org = new Organization({
      name: 'Test Org',
      slug: 'test-org',
    });
    await org.save();
  });

  it('should register a new user and organization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        organizationName: 'New Org',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message');
    
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
    expect(user.role).toEqual('customer');
  });

  it('should login an existing user', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Existing User',
      email: 'login@example.com',
      password: hashedPassword,
      role: 'admin',
      organizationId: org._id,
      isActive: true,
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
