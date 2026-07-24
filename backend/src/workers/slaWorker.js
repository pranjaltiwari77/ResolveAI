const Ticket = require('../models/Ticket');
const { checkBreach, PRIORITY_ESCALATION } = require('../services/slaService');
const { getIo } = require('../services/socketService');

const OPEN_STATUSES = ['open', 'in-progress'];
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes

const runSLACheck = async () => {
  try {
    console.log('[SLA Worker] Running SLA check...');

    // Find all open tickets that have SLA data
    const tickets = await Ticket.find({
      status: { $in: OPEN_STATUSES },
      'sla.resolutionDue': { $exists: true },
    });

    let breachedCount = 0;
    let escalatedCount = 0;

    for (const ticket of tickets) {
      const { responseBreach, resolutionBreach } = checkBreach(ticket);
      
      const updates = {};
      let changed = false;

      if (responseBreach && !ticket.sla.responseBreach) {
        updates['sla.responseBreach'] = true;
        changed = true;
      }

      if (resolutionBreach && !ticket.sla.resolutionBreach) {
        updates['sla.resolutionBreach'] = true;
        changed = true;
        breachedCount++;

        // Auto-escalate priority when resolution SLA is breached
        const newPriority = PRIORITY_ESCALATION[ticket.priority] || ticket.priority;
        if (newPriority !== ticket.priority) {
          updates.priority = newPriority;
          updates['sla.escalatedAt'] = new Date();
          escalatedCount++;
          console.log(`[SLA Worker] Escalating ticket ${ticket._id} from ${ticket.priority} → ${newPriority}`);
        }
      }

      if (changed) {
        await Ticket.findByIdAndUpdate(ticket._id, { $set: updates });
        if (updates['sla.resolutionBreach'] || updates['sla.responseBreach']) {
          // Wrap in try-catch in case socket.io isn't initialized yet
          try {
            getIo().emit('sla_breach', { ticketId: ticket._id });
          } catch (e) {
            console.log('[SLA Worker] Could not emit sla_breach, socket not ready');
          }
        }
      }
    }

    if (tickets.length > 0) {
      console.log(`[SLA Worker] Checked ${tickets.length} tickets. Breached: ${breachedCount}, Escalated: ${escalatedCount}`);
    }
  } catch (error) {
    console.error('[SLA Worker] Error during SLA check:', error.message);
  }
};

exports.startSLAWorker = () => {
  console.log('[SLA Worker] Starting background SLA check (every 5 minutes)...');
  // Run immediately on startup, then every 5 minutes
  runSLACheck();
  setInterval(runSLACheck, CHECK_INTERVAL_MS);
};
