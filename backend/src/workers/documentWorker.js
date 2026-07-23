const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple in-memory queue since Redis is not available locally
const queue = [];
let isProcessing = false;

const extractText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else {
    // Fallback for text/markdown
    return fs.readFileSync(filePath, 'utf-8');
  }
};

const chunkText = (text, maxTokens = 500) => {
  // Simple heuristic: chunk by paragraphs, then combine up to ~maxTokens words
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk.length + para.length) > (maxTokens * 5)) { // Rough char estimate
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const generateEmbedding = async (text) => {
  // Using the standard text embedding model
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

const processNext = async () => {
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }
  
  isProcessing = true;
  const documentId = queue.shift();
  
  try {
    const doc = await Document.findById(documentId);
    if (!doc) return processNext();

    doc.status = 'Processing';
    await doc.save();

    console.log(`Processing document: ${doc.filename}`);

    // 1. Extract text
    const text = await extractText(doc.storagePath, doc.mimeType);

    // 2. Clean and chunk text
    const chunks = chunkText(text);

    // 3. Generate embeddings and save
    const savePromises = chunks.map(async (chunkContent, index) => {
      const embeddingValues = await generateEmbedding(chunkContent);
      
      const chunk = new DocumentChunk({
        organizationId: doc.organizationId,
        documentId: doc._id,
        knowledgeBaseId: doc.knowledgeBaseId,
        content: chunkContent,
        embedding: embeddingValues,
        chunkIndex: index,
      });
      return chunk.save();
    });

    await Promise.all(savePromises);

    // 4. Mark as ready
    doc.status = 'Ready';
    await doc.save();
    console.log(`Document ${doc.filename} processed successfully. Chunks: ${chunks.length}`);

  } catch (error) {
    console.error(`Failed to process document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: 'Failed',
      processingError: error.message,
    });
  }

  // Process next in queue
  processNext();
};

exports.addDocumentToQueue = (documentId) => {
  queue.push(documentId);
  if (!isProcessing) {
    processNext();
  }
};
