require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "createRefundRequest",
        description: "Create a request for a refund.",
        parameters: { type: "OBJECT", properties: { orderNumber: { type: "STRING" }, reason: { type: "STRING"} }, required: ["orderNumber", "reason"] }
      }
    ]
  }
];

async function run() {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite', tools });
  const contents = [
    { role: 'user', parts: [{ text: "Context:\n\nHistory:\nUSER: I want a refund for my order ORD-10045\nASSISTANT: Yes, your order is eligible. What is the reason for the return?\n\nUser Question:\nthe item was broken" }] }
  ];

  const resultStream = await model.generateContentStream({ contents });
  
  for await (const chunk of resultStream.stream) {
    const calls = chunk.functionCalls ? chunk.functionCalls() : [];
    console.log("calls array length:", calls ? calls.length : 'undefined');
    if (calls && calls.length > 0) {
       console.log("Found call:", calls[0].name);
    }
    const callMethod = chunk.functionCall && typeof chunk.functionCall === 'function' ? chunk.functionCall() : chunk.functionCall;
    if (callMethod) {
       console.log("Found call using functionCall():", callMethod.name);
    }
  }
}
run();
