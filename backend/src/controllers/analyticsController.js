const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const orgId = new mongoose.Types.ObjectId(req.user.organizationId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // --- KPI METRICS ---
    const [totalTickets, openTickets, resolvedTickets, slaBreachedTickets] = await Promise.all([
      Ticket.countDocuments({ organizationId: orgId }),
      Ticket.countDocuments({ organizationId: orgId, status: 'open' }),
      Ticket.countDocuments({ organizationId: orgId, status: 'resolved' }),
      Ticket.countDocuments({ organizationId: orgId, 'sla.resolutionBreach': true }),
    ]);

    // Average resolution time (for resolved tickets)
    const resolvedWithTimes = await Ticket.find({
      organizationId: orgId,
      status: { $in: ['resolved', 'closed'] },
    }).select('createdAt updatedAt');

    let avgResolutionHours = 0;
    if (resolvedWithTimes.length > 0) {
      const totalMs = resolvedWithTimes.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt) - new Date(t.createdAt));
      }, 0);
      avgResolutionHours = (totalMs / resolvedWithTimes.length / (1000 * 60 * 60)).toFixed(1);
    }

    const slaBreachRate = totalTickets > 0
      ? ((slaBreachedTickets / totalTickets) * 100).toFixed(1)
      : 0;

    // --- TICKETS CREATED OVER LAST 30 DAYS ---
    const ticketsByDay = await Ticket.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const volumeData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = ticketsByDay.find(x => x._id === dateStr);
      volumeData.push({ date: dateStr.slice(5), count: found ? found.count : 0 }); // MM-DD format
    }

    // --- PRIORITY DISTRIBUTION ---
    const priorityDist = await Ticket.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityData = ['low', 'medium', 'high', 'critical'].map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: priorityDist.find(x => x._id === p)?.count || 0,
    }));

    // --- STATUS DISTRIBUTION ---
    const statusDist = await Ticket.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusData = statusDist.map(s => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count,
    }));

    // --- CATEGORY BREAKDOWN (Top 8) ---
    const categoryDist = await Ticket.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const categoryData = categoryDist.map(c => ({
      name: c._id || 'Uncategorized',
      count: c.count,
    }));

    res.status(200).json({
      kpis: {
        totalTickets,
        openTickets,
        resolvedTickets,
        slaBreachedTickets,
        avgResolutionHours: Number(avgResolutionHours),
        slaBreachRate: Number(slaBreachRate),
      },
      volumeData,
      priorityData,
      statusData,
      categoryData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
