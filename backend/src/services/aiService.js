const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const Prompt = require('../models/Prompt');
const AIUsageLog = require('../models/AIUsageLog');

// Use the API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to log AI usage
const logAIUsage = async (organizationId, type, usageMetadata) => {
  if (!usageMetadata || !organizationId) return;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Truncate to midnight

    await AIUsageLog.findOneAndUpdate(
      { organizationId, type, date: today },
      { 
        $inc: { 
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
          apiCalls: 1
        } 
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to log AI usage:', err);
  }
};

const getPrompt = async (organizationId, purpose, defaultPrompt) => {
  try {
    const activePrompt = await Prompt.findOne({ organizationId, purpose, isActive: true });
    if (activePrompt && activePrompt.systemInstruction) {
      return activePrompt.systemInstruction;
    }
  } catch (err) {
    console.error('Error fetching prompt config:', err);
  }
  return defaultPrompt;
};

const analyzeTicket = async (title, description, organizationId) => {
  try {
    let systemInstruction = await getPrompt(organizationId, 'triage', 'You are an AI IT support triage assistant. Analyze the following support ticket.');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemInstruction 
    });

    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description: "A short string (e.g., 'Billing', 'Authentication', 'UI', 'API', 'Integration', 'Bug', 'General')"
        },
        priority: {
          type: SchemaType.STRING,
          description: "A string exactly matching one of these: 'low', 'medium', 'high', 'critical'"
        },
        sentiment: {
          type: SchemaType.STRING,
          description: "A short string describing the user's sentiment (e.g., 'frustrated', 'neutral', 'positive')"
        },
        suggestedResolution: {
          type: SchemaType.STRING,
          description: "A single sentence suggesting a first troubleshooting step or resolution."
        }
      },
      required: ["category", "priority", "sentiment", "suggestedResolution"]
    };

    const prompt = `Title: ${title}\nDescription: ${description}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const response = await result.response;
    const text = response.text();

    // Log usage if orgId is provided
    if (organizationId) {
      await logAIUsage(organizationId, 'triage', response.usageMetadata);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    // Return graceful fallback if AI fails (e.g. no API key or network error)
    return {
      category: 'General',
      priority: 'medium',
      sentiment: 'neutral',
      suggestedResolution: 'Could not generate AI insights at this time.',
    };
  }
};

const generateArticle = async (title, insights) => {
  try {
    const systemInstruction = `You are a technical writer for a SaaS customer support team.
A support ticket has been resolved and we want to create a Knowledge Base article from it.

Write a clear, concise, and helpful Knowledge Base article in Markdown format.
The article should:
1. Start with a brief summary of the problem (1-2 sentences).
2. Have a "Symptoms" section listing common signs of this issue.
3. Have a "Resolution Steps" section with a numbered list of actionable steps.
4. End with a short "Prevention" tip.

Output ONLY the raw Markdown. Do not include any preamble or explanation.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemInstruction
    });

    const prompt = `Ticket Title: ${title}\nCategory: ${insights?.category || 'General'}\nSuggested Resolution: ${insights?.suggestedResolution || 'N/A'}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Strip potential markdown code fences
    text = text.replace(/^```(?:markdown)?\n?/i, '').replace(/\n?```$/, '').trim();

    return text;
  } catch (error) {
    console.error('Article generation failed:', error);
    return `## ${title}\n\nThis article was auto-generated but content could not be retrieved. Please add content manually.`;
  }
};

const semanticSearchArticles = async (query, articles) => {
  if (!query || !articles || articles.length === 0) return [];
  try {
    const systemInstruction = `You are an AI semantic search engine for a Knowledge Base. 
Given a user query and a JSON list of articles, return a JSON array containing ONLY the string IDs of the top 5 most relevant articles.
Order them from most relevant to least relevant. If none are relevant, return an empty array [].
Do NOT include any explanations or formatting outside of the JSON array.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite',
      systemInstruction
    });

    const prompt = `User Query: "${query}"\n\nArticles JSON:\n${JSON.stringify(articles.map(a => ({ id: a._id.toString(), title: a.title, category: a.category, excerpt: a.content.substring(0, 100) })))}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Semantic search failed:', error);
    // Fallback to basic keyword search if AI fails
    const q = query.toLowerCase();
    return articles
      .filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
      .map(a => a._id.toString())
      .slice(0, 5);
  }
};

module.exports = {
  analyzeTicket,
  generateArticle,
  getPrompt,
  logAIUsage,
  semanticSearchArticles,
};
