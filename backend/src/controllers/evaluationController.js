const EvaluationCase = require('../models/EvaluationCase');
const EvaluationRun = require('../models/EvaluationRun');
const Prompt = require('../models/Prompt');

// Get all test cases
exports.getCases = async (req, res) => {
  try {
    const cases = await EvaluationCase.find({ organizationId: req.user.organizationId });
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch evaluation cases', error: error.message });
  }
};

// Create a test case
exports.createCase = async (req, res) => {
  try {
    const newCase = new EvaluationCase({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create evaluation case', error: error.message });
  }
};

// Get past evaluation runs
exports.getRuns = async (req, res) => {
  try {
    const runs = await EvaluationRun.find({ organizationId: req.user.organizationId })
      .populate('promptVersion', 'name version')
      .sort({ createdAt: -1 });
    res.status(200).json(runs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch evaluation runs', error: error.message });
  }
};

// Run Evaluation Suite (Mocked for demonstration)
exports.runEvaluation = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    
    // Find active chat prompt
    const activePrompt = await Prompt.findOne({ organizationId: orgId, purpose: 'chat', isActive: true });
    if (!activePrompt) {
      return res.status(400).json({ message: 'No active chat prompt found to evaluate. Please create and activate a prompt first.' });
    }

    // Check if cases exist, if not, generate some mock cases to evaluate
    let cases = await EvaluationCase.find({ organizationId: orgId });
    if (cases.length === 0) {
       // Seed a few cases just so the UI looks good
       const seedCases = [
         { organizationId: orgId, question: 'How do I reset my password?', expectedAnswer: 'Go to settings -> reset password.', category: 'Authentication' },
         { organizationId: orgId, question: 'Where is the pricing page?', expectedAnswer: 'Our pricing is at resolveai.com/pricing', category: 'General' },
         { organizationId: orgId, question: 'How do I bake a cake?', expectedAnswer: 'REFUSAL', category: 'Off-topic' },
       ];
       await EvaluationCase.insertMany(seedCases);
       cases = await EvaluationCase.find({ organizationId: orgId });
    }

    // Generate mock results
    const results = cases.map(c => ({
      caseId: c._id,
      question: c.question,
      aiAnswer: 'Mock AI answer based on ' + activePrompt.name,
      isCorrect: Math.random() > 0.1, // 90% correct
      hasCorrectCitation: Math.random() > 0.2, // 80% citation accuracy
      refusalAccurate: c.category === 'Off-topic' ? true : null, // Only applicable to off-topic
      tokensUsed: Math.floor(Math.random() * 200) + 50,
      responseTimeMs: Math.floor(Math.random() * 1500) + 300,
    }));

    const correctCount = results.filter(r => r.isCorrect).length;
    const citationCount = results.filter(r => r.hasCorrectCitation).length;
    const refusalCount = results.filter(r => r.refusalAccurate === true).length;
    const totalRefusals = results.filter(r => r.refusalAccurate !== null).length;

    const correctnessScore = Math.round((correctCount / results.length) * 100);
    const citationScore = Math.round((citationCount / results.length) * 100);
    const refusalScore = totalRefusals > 0 ? Math.round((refusalCount / totalRefusals) * 100) : 100;
    const avgResponseTime = Math.round(results.reduce((acc, r) => acc + r.responseTimeMs, 0) / results.length);
    const totalTokens = results.reduce((acc, r) => acc + r.tokensUsed, 0);

    const run = new EvaluationRun({
      organizationId: orgId,
      promptVersion: activePrompt._id,
      results,
      correctnessScore,
      citationScore,
      refusalScore,
      averageResponseTime: avgResponseTime,
      totalTokens,
      estimatedCost: (totalTokens / 1000) * 0.0002, // Gemini flash lite cost est
    });

    await run.save();
    res.status(200).json(run);
  } catch (error) {
    res.status(500).json({ message: 'Failed to run evaluation', error: error.message });
  }
};
