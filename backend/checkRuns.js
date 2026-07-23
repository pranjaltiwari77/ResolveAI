require('dotenv').config();
const mongoose = require('mongoose');
const EvaluationRun = require('./src/models/EvaluationRun');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolveai');
  const runs = await EvaluationRun.find({});
  console.log(runs.length);
  process.exit(0);
}
test();
