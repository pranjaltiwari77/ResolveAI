// Mock Business Service to simulate e-commerce backend integration

// --- Mock Data ---
const MOCK_ORDERS = {
  'ORD-10045': {
    orderNumber: 'ORD-10045',
    customerId: 'user-1',
    status: 'Shipped',
    items: ['Wireless Headphones', 'USB-C Cable'],
    paymentStatus: 'Paid',
    total: '$150.00',
    orderDate: '2026-07-15',
    deliveryEstimate: '2026-07-25',
    refundEligible: true,
  },
  'ORD-10046': {
    orderNumber: 'ORD-10046',
    customerId: 'user-1',
    status: 'Delivered',
    items: ['Ergonomic Keyboard'],
    paymentStatus: 'Paid',
    total: '$90.00',
    orderDate: '2026-05-10',
    deliveryEstimate: '2026-05-15',
    refundEligible: false, // Too old
  },
};

// --- Read-Only Functions ---

exports.getOrderStatus = async ({ orderNumber }) => {
  const order = MOCK_ORDERS[orderNumber];
  if (!order) return { error: `Order ${orderNumber} not found.` };
  
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryEstimate: order.deliveryEstimate,
    items: order.items,
  };
};

exports.getCustomerOrders = async ({ customerId }) => {
  const orders = Object.values(MOCK_ORDERS).filter(o => o.customerId === customerId || customerId === 'user-1'); // defaulting user-1 for testing
  return {
    customerId,
    orders: orders.map(o => ({ orderNumber: o.orderNumber, status: o.status, total: o.total }))
  };
};

exports.getPaymentStatus = async ({ orderNumber }) => {
  const order = MOCK_ORDERS[orderNumber];
  if (!order) return { error: `Order ${orderNumber} not found.` };
  
  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    total: order.total
  };
};

exports.checkRefundEligibility = async ({ orderNumber }) => {
  const order = MOCK_ORDERS[orderNumber];
  if (!order) return { error: `Order ${orderNumber} not found.` };
  
  return {
    orderNumber: order.orderNumber,
    eligible: order.refundEligible,
    reason: order.refundEligible ? 'Within 30-day window' : 'Outside of 30-day refund window'
  };
};


// --- Write Functions ---

exports.createRefundRequest = async ({ orderNumber, reason }) => {
  // In a real system, this would call Stripe or Shopify
  return {
    success: true,
    message: `Refund request created for ${orderNumber}.`,
    reasonProvided: reason,
    refundId: `REF-${Math.floor(Math.random() * 10000)}`
  };
};

exports.escalateTicket = async ({ ticketId, department, reason }) => {
  // In a real system, this would change the ticket owner or queue
  return {
    success: true,
    message: `Ticket ${ticketId || 'current'} escalated to ${department}.`,
    reasonProvided: reason,
  };
};

exports.createSupportTicket = async ({ customerId, title, description }) => {
  // In a real system, this would hit the ticketController logic
  return {
    success: true,
    message: `New support ticket created: ${title}`,
    ticketId: `TKT-${Math.floor(Math.random() * 10000)}`
  };
};

// Map of all available functions
exports.functionMap = {
  getOrderStatus: exports.getOrderStatus,
  getCustomerOrders: exports.getCustomerOrders,
  getPaymentStatus: exports.getPaymentStatus,
  checkRefundEligibility: exports.checkRefundEligibility,
  createRefundRequest: exports.createRefundRequest,
  escalateTicket: exports.escalateTicket,
  createSupportTicket: exports.createSupportTicket
};
