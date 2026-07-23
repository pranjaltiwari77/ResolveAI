require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "getOrderStatus",
        description: "Get the status of an order.",
        parameters: { type: "OBJECT", properties: { orderNumber: { type: "STRING" } }, required: ["orderNumber"] }
      }
    ]
  }
];

async function run() {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite', tools });
  const chat = model.startChat({});
  const resultStream = await chat.sendMessageStream("hello");
  
  for await (const chunk of resultStream.stream) {
    console.log("Chunk:", JSON.stringify(chunk, null, 2));
    const calls = chunk.functionCalls ? chunk.functionCalls() : [];
    if (chunk.functionCall || calls.length > 0) {
      console.log("Called function:", chunk.functionCall || calls[0]);
    }
    try {
      if (typeof chunk.text === 'function') {
        const chunkText = chunk.text();
        console.log("Extracted text:", chunkText);
      }
    } catch(e) {}
  }
}
run();
