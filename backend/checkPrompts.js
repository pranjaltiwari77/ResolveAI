require('dotenv').config();
const mongoose = require('mongoose');
const Prompt = require('./src/models/Prompt');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolveai');
  const prompts = await Prompt.find({});
  console.log(prompts);
  process.exit(0);
}
test();
