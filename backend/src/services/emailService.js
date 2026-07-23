const nodemailer = require('nodemailer');

// Initialize transporter
// In production, configure with your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
// For development/mocking, if no config is provided, we just log to console.
let transporter;

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate an Ethereal test account if no real SMTP is provided
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email Service] Mock Ethereal email configured (user: ${testAccount.user})`);
    } catch (err) {
      console.log('[Email Service] Failed to create Ethereal account, falling back to console mock');
      transporter = {
        sendMail: async (opts) => console.log('\n[MOCK EMAIL SEND]\nTo:', opts.to, '\nSubject:', opts.subject, '\nBody:', opts.html || opts.text, '\n'),
      };
    }
  }
};

// Initialize it once
createTransporter();

/**
 * Generic email sender
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!transporter) await createTransporter();
    
    const info = await transporter.sendMail({
      from: `"ResolveAI Support" <${process.env.SMTP_FROM || 'support@resolveai.local'}>`,
      to,
      subject,
      html,
    });

    if (info?.messageId) {
      console.log(`[Email Service] Sent to ${to} | ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl) {
        console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    }
    return true;
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

// ==========================================
// NOTIFICATION TEMPLATES
// ==========================================

exports.sendTicketCreatedEmail = async (userEmail, ticketTitle, ticketId) => {
  const html = `
    <h2>Ticket Received</h2>
    <p>We've received your support request: <strong>${ticketTitle}</strong> (#${ticketId})</p>
    <p>Our team is reviewing it and will get back to you shortly based on priority SLA.</p>
    <br/>
    <p>Best,<br/>ResolveAI Team</p>
  `;
  return sendEmail({ to: userEmail, subject: `Ticket Received: ${ticketTitle}`, html });
};

exports.sendTicketAssignedEmail = async (agentEmail, agentName, ticketTitle, ticketId) => {
  const html = `
    <h2>Ticket Assigned to You</h2>
    <p>Hi ${agentName},</p>
    <p>You have been assigned to ticket <strong>#${ticketId}</strong>: ${ticketTitle}.</p>
    <p>Please log in to the dashboard to review and resolve the issue.</p>
  `;
  return sendEmail({ to: agentEmail, subject: `Ticket Assigned: ${ticketTitle}`, html });
};

exports.sendTicketResolvedEmail = async (userEmail, ticketTitle, ticketId) => {
  const html = `
    <h2>Ticket Resolved</h2>
    <p>Good news! Your ticket <strong>${ticketTitle}</strong> (#${ticketId}) has been resolved.</p>
    <p>If you have any further questions, please reply to this email or open a new ticket.</p>
  `;
  return sendEmail({ to: userEmail, subject: `Resolved: ${ticketTitle}`, html });
};

exports.sendInviteEmail = async (inviteeEmail, inviteeName, tempPassword, orgName) => {
  const html = `
    <h2>Welcome to ${orgName}!</h2>
    <p>Hi ${inviteeName},</p>
    <p>You have been invited to join the ${orgName} support team on ResolveAI.</p>
    <p>Your temporary password is: <strong>${tempPassword}</strong></p>
    <p>Please log in and change your password immediately.</p>
  `;
  return sendEmail({ to: inviteeEmail, subject: `Invitation to join ${orgName}`, html });
};

exports.sendPublicReplyEmail = async (customerEmail, agentName, ticketTitle, ticketId, replyContent) => {
  const html = `
    <h2>Re: ${ticketTitle} (#${ticketId})</h2>
    <p><strong>${agentName}</strong> replied:</p>
    <div style="border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1rem 0; white-space: pre-wrap;">${replyContent}</div>
    <br/>
    <p>To add additional comments, please reply to this email.</p>
  `;
  return sendEmail({ to: customerEmail, subject: `Update on your ticket: ${ticketTitle}`, html });
};
