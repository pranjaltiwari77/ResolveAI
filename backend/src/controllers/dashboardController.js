const Ticket = require('../models/Ticket');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // Total open tickets
    const openTickets = await Ticket.countDocuments({
      organizationId: orgId,
      status: 'open',
    });

    // Tickets resolved today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const resolvedToday = await Ticket.countDocuments({
      organizationId: orgId,
      status: 'resolved',
      updatedAt: { $gte: startOfToday },
    });

    // AI suggestions used (tickets that have a real suggestedResolution from AI)
    const totalTickets = await Ticket.countDocuments({ organizationId: orgId });
    const ticketsWithAI = await Ticket.countDocuments({
      organizationId: orgId,
      'aiInsights.suggestedResolution': {
        $exists: true,
        $ne: 'Could not generate AI insights at this time.',
      },
    });

    const aiUsagePercent = totalTickets > 0
      ? Math.round((ticketsWithAI / totalTickets) * 100)
      : 0;

    // Avg response time (mock for now — requires agent assignment feature)
    const avgResponseTime = '3.2m';

    // Recent 5 tickets
    const recentTickets = await Ticket.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('agentId', 'name');

    res.status(200).json({
      openTickets,
      resolvedToday,
      aiUsagePercent,
      avgResponseTime,
      recentTickets,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
