const Prompt = require('../models/Prompt');

// Get all prompts for the organization
exports.getPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find({ organizationId: req.user.organizationId }).sort({ purpose: 1, version: -1 });
    res.status(200).json(prompts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch prompts', error: error.message });
  }
};

// Create a new prompt version
exports.createPrompt = async (req, res) => {
  try {
    const { name, purpose, systemInstruction, inputTemplate, outputSchema, model, temperature, maxTokens, isActive } = req.body;
    
    // Find highest version for this purpose
    const highestVersionPrompt = await Prompt.findOne({ organizationId: req.user.organizationId, purpose }).sort({ version: -1 });
    const version = highestVersionPrompt ? highestVersionPrompt.version + 1 : 1;

    // If setting to active, deactivate all other versions for this purpose
    if (isActive) {
      await Prompt.updateMany(
        { organizationId: req.user.organizationId, purpose },
        { $set: { isActive: false } }
      );
    }

    const newPrompt = new Prompt({
      organizationId: req.user.organizationId,
      name,
      purpose,
      version,
      systemInstruction,
      inputTemplate,
      outputSchema,
      model,
      temperature,
      maxTokens,
      isActive,
      createdBy: req.user.userId,
    });

    await newPrompt.save();
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create prompt', error: error.message });
  }
};

// Activate a specific prompt version
exports.activatePrompt = async (req, res) => {
  try {
    const prompt = await Prompt.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

    // Deactivate all others of same purpose
    await Prompt.updateMany(
      { organizationId: req.user.organizationId, purpose: prompt.purpose },
      { $set: { isActive: false } }
    );

    // Activate this one
    prompt.isActive = true;
    await prompt.save();

    res.status(200).json(prompt);
  } catch (error) {
    res.status(500).json({ message: 'Failed to activate prompt', error: error.message });
  }
};
