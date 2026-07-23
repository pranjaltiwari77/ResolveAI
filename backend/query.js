require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Users:', await User.find({}));
  console.log('Organizations:', await Organization.find({}));
  process.exit(0);
}
run().catch(console.error);
