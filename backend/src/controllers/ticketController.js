const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { analyzeTicket } = require('../services/aiService');
const { getSLADeadlines } = require('../services/slaService');
const emailService = require('../services/emailService');
const { generateDeflection } = require('../services/ragService');
const { getIo } = require('../services/socketService');

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Step 1: Use AI to analyze the ticket
    const aiAnalysis = await analyzeTicket(title, description, req.user.organizationId);

    // Feature 2: Sentiment Priority Override
    // If the customer is very angry, frustrated, or urgent, force priority to critical
    let finalPriority = aiAnalysis.priority || 'medium';
    const badSentiments = ['frustrated', 'angry', 'upset', 'furious', 'urgent', 'critical'];
    if (aiAnalysis.sentiment && badSentiments.some(s => aiAnalysis.sentiment.toLowerCase().includes(s))) {
      finalPriority = 'critical';
      aiAnalysis.category = 'Escalation'; // Optional: force category too
    }

    // Feature 4: Smart AI Auto-Assignment
    // Find an available admin or support_agent in the same organization
    const availableAgents = await User.find({
      organizationId: req.user.organizationId,
      role: { $in: ['admin', 'support_agent'] },
      isActive: true,
    });
    
    // Pick a random agent, or we could match based on category. Let's just pick a random one for now.
    let assignedAgentId = null;
    if (availableAgents.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAgents.length);
      assignedAgentId = availableAgents[randomIndex]._id;
    }

    // Step 2: Calculate SLA deadlines based on AI-determined priority
    const slaDeadlines = getSLADeadlines(finalPriority);

    // Step 3: Create ticket in DB
    const newTicket = new Ticket({
      title,
      description,
      creatorId: req.user.userId,
      organizationId: req.user.organizationId,
      category: aiAnalysis.category,
      priority: finalPriority,
      agentId: assignedAgentId,
      aiInsights: {
        sentiment: aiAnalysis.sentiment,
        suggestedResolution: aiAnalysis.suggestedResolution,
      },
      sla: slaDeadlines,
      initialAiCategory: aiAnalysis.category,
      initialAiPriority: aiAnalysis.priority,
    });

    // Auto-assign to the only admin in the system
    const admin = await User.findOne({ role: 'admin', organizationId: req.user.organizationId });
    if (admin) {
      newTicket.agentId = admin._id;
    }

    // Add first comment
    newTicket.comments.push({
      author: req.user.userId,
      content: description,
      isPublic: true,
    });

    await newTicket.save();

    // Emit global push notification
    getIo().emit('ticket_created', { id: newTicket._id, title: newTicket.title });

    // Populate agent if assigned (currently unassigned by default)
    await newTicket.populate('agentId', 'name email');

    // Attempt to notify creator
    const creator = await User.findById(req.user.userId);
    if (creator && creator.email) {
      emailService.sendTicketCreatedEmail(creator.email, newTicket.title, newTicket.id).catch(err => console.error(err));
    }

    res.status(201).json(newTicket);

    // Feature: AI First Responder Auto-Reply
    // Do this asynchronously so we don't block the response
    if (!title.startsWith('Escalation:')) {
      (async () => {
        try {
          const solution = await generateDeflection(title, description, req.user.organizationId);
          if (solution) {
            const aiContent = `Hello! I'm ResolveBot, your AI Support Assistant. Based on our knowledge base, here is a potential solution to your issue:\n\n${solution}\n\nDid this resolve your issue?`;
            
            const updatedTicket = await Ticket.findOneAndUpdate(
              { _id: newTicket._id },
              {
                $push: {
                  comments: {
                    content: aiContent,
                    isPublic: true,
                    isAi: true
                  }
                }
              },
              { new: true }
            )
              .populate('agentId', 'name email')
              .populate('creatorId', 'name email')
              .populate('comments.author', 'name role');

            try {
              getIo().to(`ticket_${newTicket._id}`).emit('comment_added', updatedTicket);
            } catch (e) {
              console.error('Socket emit failed for AI auto-reply', e);
            }
          }
        } catch (err) {
          console.error('AI First Responder failed:', err);
        }
      })();
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// Get all tickets for the user's organization (filtered by role)
// Get all tickets for the user's organization
exports.getTickets = async (req, res) => {
  try {
    const query = { organizationId: req.user.organizationId };
    if (req.user.role === 'customer') {
      query.creatorId = req.user.userId;
    }

    const tickets = await Ticket.find(query)
      .populate('agentId', 'name email')
      .populate('creatorId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
};

// Get a single ticket
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    })
      .populate('agentId', 'name email')
      .populate('creatorId', 'name email')
      .populate('comments.author', 'name role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ticket', error: error.message });
  }
};

// Update a ticket
exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, agentId } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const previousStatus = ticket.status;
    const previousAgentId = ticket.agentId?.toString();

    if (status !== undefined) ticket.status = status;
    if (priority !== undefined) ticket.priority = priority;
    if (agentId !== undefined) ticket.agentId = agentId;
    if (req.body.category !== undefined) ticket.category = req.body.category;

    // When ticket is resolved/closed, clear breach flags
    if (status === 'resolved' || status === 'closed') {
      ticket.sla.responseBreach = false;
      ticket.sla.resolutionBreach = false;
    }

    await ticket.save();
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('creatorId', 'name email')
      .populate('agentId', 'name email')
      .populate('comments.author', 'name email role');

    try {
      getIo().emit('ticket_updated', updatedTicket);
      getIo().to(`ticket_${ticket._id}`).emit('ticket_updated', updatedTicket);
    } catch (e) {}

    // Trigger emails based on state change
    if (status === 'resolved' && previousStatus !== 'resolved') {
      emailService.sendTicketResolvedEmail('customer@example.com', ticket.title, ticket.id).catch(err => console.error(err));
    }

    if (agentId && previousAgentId !== agentId) {
      if (updatedTicket.agentId && updatedTicket.agentId.email) {
        emailService.sendTicketAssignedEmail(updatedTicket.agentId.email, updatedTicket.agentId.name, ticket.title, ticket.id).catch(err => console.error(err));
      }
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
};

// Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
  }
};

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const { content, isPublic, attachmentUrl, attachmentType } = req.body;
    if (!content && !attachmentUrl) return res.status(400).json({ message: 'Comment content or attachment is required' });

    const ticketToUpdate = await Ticket.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!ticketToUpdate) return res.status(404).json({ message: 'Ticket not found' });

    const commentsToPush = [];

    // Check if this is the first time this admin/agent is commenting
    if (req.user.role === 'admin' || req.user.role === 'support_agent') {
      const hasCommented = ticketToUpdate.comments.some(
        c => c.author && c.author.toString() === req.user.userId
      );
      if (!hasCommented) {
        // Fetch the agent's name from the DB since it's not in the JWT
        const agentUser = await User.findById(req.user.userId);
        const agentName = agentUser ? agentUser.name : 'A support agent';
        
        commentsToPush.push({
          content: `${agentName} is assigned to help you.`,
          isPublic: true,
          isSystem: true
        });
      }
    }

    // Add the actual comment
    commentsToPush.push({
      author: req.user.userId,
      content: content || '', // allow empty content if there is an attachment
      isPublic: !!isPublic,
      attachmentUrl,
      attachmentType
    });

    let ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      {
        $push: {
          comments: { $each: commentsToPush }
        }
      },
      { new: true }
    )
      .populate('agentId', 'name email')
      .populate('creatorId', 'name email')
      .populate('comments.author', 'name role');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    try {
      getIo().to(`ticket_${ticket._id}`).emit('comment_added', ticket);
    } catch (e) {}

    if (isPublic && ticket.creatorId?.email) {
      emailService.sendPublicReplyEmail(ticket.creatorId.email, req.user.name, ticket.title, ticket.id, content)
        .catch(err => console.error(err));
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Generate an AI draft reply
exports.generateDraftReply = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    }).populate('comments.author', 'name role');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Build context for AI
    const history = ticket.comments.map(c => `[${c.isPublic ? 'Public' : 'Internal'}] ${c.author.name}: ${c.content}`).join('\n');
    
    const prompt = `
      You are an expert customer support agent drafting a reply to a customer.
      Ticket Title: ${ticket.title}
      Ticket Description: ${ticket.description}
      Conversation History:
      ${history}
      
      Please write a professional, empathetic, and concise public reply to the customer. 
      Only output the exact message text you want to send. Do not include subject lines or wrapping.
    `;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const draftText = response.text().trim();

    res.status(200).json({ draft: draftText });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate draft', error: error.message });
  }
};

// Feature 1: Deflect Ticket (Zero-Touch Resolution)
exports.deflectTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Call the ragService to see if a direct answer exists
    const solution = await generateDeflection(title, description, req.user.organizationId);
    
    if (solution) {
      return res.status(200).json({ deflected: true, solution });
    }
    
    return res.status(200).json({ deflected: false });
  } catch (error) {
    // If RAG fails, fail open (allow them to just create the ticket)
    console.error('Deflection failed:', error);
    res.status(200).json({ deflected: false });
  }
};
