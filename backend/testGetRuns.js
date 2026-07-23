require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { getRuns } = require('./src/controllers/evaluationController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolveai');
  const user = await User.findOne({ role: 'admin' });
  
  const req = { user: { organizationId: user.organizationId } };
  const res = {
    status: (code) => ({
      json: (data) => console.log(`Status: ${code}`, data.length, data[0])
    })
  };
  
  await getRuns(req, res);
  process.exit(0);
}
test();
