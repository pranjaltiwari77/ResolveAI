const request = require('supertest');
const express = require('express');
const { authenticate, requireRole } = require('../src/middlewares/authMiddleware');

process.env.JWT_SECRET = 'testsecret';
const app = express();
app.use(express.json());

// Mock route that requires admin
app.get('/api/admin-only', authenticate, requireRole(['admin']), (req, res) => {
  res.status(200).json({ success: true });
});

describe('Role Authorization', () => {
  it('should block non-admin users from admin routes', async () => {
    // Generate a mock JWT for a customer role
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: '123', role: 'customer' }, process.env.JWT_SECRET);

    const res = await request(app)
      .get('/api/admin-only')
      .set('Authorization', `Bearer ${token}`);

    // Assuming your middleware returns 403 for forbidden
    expect(res.statusCode).toEqual(403);
  });

  it('should allow admin users to access admin routes', async () => {
    // We need to mock User.findById because authMiddleware fetches the user
    const User = require('../src/models/User');
    const orgId = '5f8d04b3a4a0c80017a4b819';
    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: '123',
      role: 'admin',
      organizationId: orgId
    });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: '123', role: 'admin' }, process.env.JWT_SECRET);

    const res = await request(app)
      .get('/api/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    User.findById.mockRestore();
  });
});
