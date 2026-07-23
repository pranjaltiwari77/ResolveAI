// SLA deadlines in milliseconds based on priority
const SLA_CONFIG = {
  critical: { responseMs: 1 * 60 * 60 * 1000,  resolutionMs: 4 * 60 * 60 * 1000  }, // 1h / 4h
  high:     { responseMs: 4 * 60 * 60 * 1000,  resolutionMs: 8 * 60 * 60 * 1000  }, // 4h / 8h
  medium:   { responseMs: 8 * 60 * 60 * 1000,  resolutionMs: 24 * 60 * 60 * 1000 }, // 8h / 24h
  low:      { responseMs: 24 * 60 * 60 * 1000, resolutionMs: 72 * 60 * 60 * 1000 }, // 24h / 72h
};

const PRIORITY_ESCALATION = {
  low: 'medium',
  medium: 'high',
  high: 'critical',
  critical: 'critical', // Already at max
};

/**
 * Calculate SLA due dates for a given priority and creation timestamp.
 */
exports.getSLADeadlines = (priority, createdAt = new Date()) => {
  const config = SLA_CONFIG[priority] || SLA_CONFIG.medium;
  return {
    responseDue: new Date(createdAt.getTime() + config.responseMs),
    resolutionDue: new Date(createdAt.getTime() + config.resolutionMs),
    responseBreach: false,
    resolutionBreach: false,
  };
};

/**
 * Check SLA status for a ticket and return breach info.
 */
exports.checkBreach = (ticket) => {
  const now = new Date();
  const sla = ticket.sla || {};

  const responseBreach  = sla.responseDue  && now > new Date(sla.responseDue);
  const resolutionBreach = sla.resolutionDue && now > new Date(sla.resolutionDue);

  return { responseBreach, resolutionBreach };
};

/**
 * Get minutes remaining until a deadline.
 * Returns negative value if already past.
 */
exports.getMinutesRemaining = (deadline) => {
  if (!deadline) return null;
  return Math.floor((new Date(deadline) - new Date()) / 60000);
};

exports.PRIORITY_ESCALATION = PRIORITY_ESCALATION;
exports.SLA_CONFIG = SLA_CONFIG;
