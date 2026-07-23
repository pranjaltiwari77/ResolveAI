const nodemailer = require('nodemailer');

let transporter;

async function initMailer() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    // Use real Gmail account if configured
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    console.log(`✉️ Mailer initialized using Gmail (${user})`);
  } else {
    // Fallback to Ethereal for testing if no env vars
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
    console.log('✉️ Mailer initialized (using Ethereal for testing)');
  }
}

initMailer();

const sendVerificationEmail = async (toEmail, otp) => {
  if (!transporter) {
    console.error('Mailer not initialized yet!');
    return;
  }

  const mailOptions = {
    from: `"ResolveAI Support" <${process.env.EMAIL_USER || 'no-reply@resolveai.com'}>`,
    to: toEmail,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">ResolveAI</h2>
        <p>Thank you for signing up! Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; letter-spacing: 5px; color: #1e293b;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n==============================================`);
    console.log(`✉️ Email sent to ${toEmail}`);
    if (!process.env.EMAIL_USER) {
      console.log(`👉 View your email here: ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log(`==============================================\n`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendVerificationEmail };
