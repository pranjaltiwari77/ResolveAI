const PendingAction = require('../models/PendingAction');
const businessService = require('../services/businessService');

exports.approveAction = async (req, res) => {
  try {
    const { id } = req.params;
    const action = await PendingAction.findById(id);

    if (!action) return res.status(404).json({ message: 'Action not found' });
    if (action.status !== 'pending') return res.status(400).json({ message: 'Action is not pending' });

    // Execute the function
    const fn = businessService.functionMap[action.functionName];
    if (!fn) return res.status(400).json({ message: `Function ${action.functionName} not found` });

    let result;
    try {
      result = await fn(action.arguments || {});
      
      action.status = 'executed';
      action.result = result;
      action.approvedBy = req.user.userId;
      action.executedAt = new Date();
      await action.save();
      
      res.json(action);
    } catch (err) {
      action.status = 'failed';
      action.result = { error: err.message };
      await action.save();
      return res.status(500).json({ message: 'Function execution failed', error: err.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rejectAction = async (req, res) => {
  try {
    const { id } = req.params;
    const action = await PendingAction.findById(id);

    if (!action) return res.status(404).json({ message: 'Action not found' });
    if (action.status !== 'pending') return res.status(400).json({ message: 'Action is not pending' });

    action.status = 'rejected';
    action.approvedBy = req.user.userId;
    action.executedAt = new Date();
    await action.save();
    
    res.json(action);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
