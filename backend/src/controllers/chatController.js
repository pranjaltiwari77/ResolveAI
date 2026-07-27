const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { generateAnswerStream } = require('../services/ragService');
const { getIo } = require('../services/socketService');

exports.createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = new Conversation({
      organizationId: req.user.organizationId,
      customerId: req.user.userId, // Assuming customer is the logged-in user for now
      title: title || 'New Conversation',
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      organizationId: req.user.organizationId,
      customerId: req.user.userId 
    }).sort({ updatedAt: -1 });
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ 
      conversationId,
      organizationId: req.user.organizationId 
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

exports.sendMessageStream = async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = generateAnswerStream(
      conversationId, 
      req.user.organizationId, 
      req.user.userId, 
      message
    );

    for await (const chunk of stream) {
      // Format SSE payload: data: <json string>\n\n
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
  } finally {
    res.end();
  }
};

exports.rateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { feedback } = req.body; // 'helpful', 'not-helpful'

    if (!['helpful', 'not-helpful'].includes(feedback)) {
      return res.status(400).json({ message: 'Invalid feedback value' });
    }

    const message = await Message.findOneAndUpdate(
      { _id: messageId, organizationId: req.user.organizationId },
      { $set: { feedback } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to rate message', error: error.message });
  }
};

exports.escalateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Fetch conversation and messages
    const conversation = await Conversation.findOne({ _id: conversationId, organizationId: req.user.organizationId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId, organizationId: req.user.organizationId }).sort({ createdAt: 1 });
    
    if (messages.length === 0) {
      return res.status(400).json({ message: 'Cannot escalate an empty conversation' });
    }

    // Format chat history into a Markdown description
    let description = `*This ticket was automatically escalated from an AI Support Chat.*\n\n### Chat History:\n\n`;
    messages.forEach(msg => {
      // Strip action required blocks
      const cleanContent = msg.content.replace(/\[ACTION_REQUIRED:.*?\]/g, '').trim();
      if (cleanContent) {
        const role = msg.role === 'user' ? '**Customer**' : '**AI Assistant**';
        description += `${role}:\n${cleanContent}\n\n`;
      }
    });

    // Create the Ticket
    const ticket = new Ticket({
      organizationId: req.user.organizationId,
      title: `Escalation: ${conversation.title}`,
      description,
      status: 'open',
      priority: 'high',
      category: 'Support Escalation',
      customer: {
        name: req.user.name || 'Customer',
        email: req.user.email || 'customer@example.com'
      }
    });

    await ticket.save();

    // Emit global push notification
    getIo().emit('ticket_created', { id: ticket._id.toString(), title: ticket.title });

    res.status(201).json({ message: 'Escalated to ticket successfully', ticketId: ticket._id });
  } catch (error) {
    console.error('Escalation failed:', error);
    res.status(500).json({ message: 'Failed to escalate conversation', error: error.message });
  }
};
