require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { runEvaluation } = require('./src/controllers/evaluationController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolveai');
  const user = await User.findOne({ role: 'admin' });
  if (!user) return console.log('No admin found');
  
  const req = { user: { organizationId: user.organizationId } };
  const res = {
    status: (code) => ({
      json: (data) => console.log(`Status: ${code}`, data)
    })
  };
  
  await runEvaluation(req, res);
  process.exit(0);
}
test();
