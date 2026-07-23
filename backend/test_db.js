require('dotenv').config();
const mongoose = require('mongoose');
const PendingAction = require('./src/models/PendingAction');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const pendingAction = await PendingAction.create({
      organizationId: "6a5e0a06153137fe6ca80b41",
      conversationId: "6a61aaeecd14bb9729da5787",
      functionName: "createRefundRequest",
      arguments: { orderNumber: "ORD-10045", reason: "the item was broken" },
      status: 'pending',
      requestedByAI: true
    });
    console.log("Success:", pendingAction._id);
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit();
}
run();
