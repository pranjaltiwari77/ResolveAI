require('dotenv').config();
const { generateAnswerStream } = require('./src/services/ragService');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const stream = generateAnswerStream("6a61aaeecd14bb9729da5787", "6a5e0a06153137fe6ca80b41", "6a6093d528b0ebb746436488", "the item was broken");
    for await (const chunk of stream) {
      console.log("Chunk:", chunk);
    }
  } catch(e) {
    console.error(e.stack);
  }
  process.exit();
}
run();
