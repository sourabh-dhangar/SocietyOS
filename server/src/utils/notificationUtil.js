const nodemailer = require('nodemailer');

// Initialize transporter
// Falls back to generic testing credentials if not provided in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'testaccount@ethereal.email', // Replace with real in production
    pass: process.env.SMTP_PASS || 'testpassword',
  },
});

/**
 * Send an email notification
 * @param {String} to - Recipient email address
 * @param {String} subject - Subject line
 * @param {String} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
  if (!to) return;
  
  try {
    const info = await transporter.sendMail({
      from: `"Nakshatra Society" <${process.env.SMTP_USER || 'no-reply@nakshatra.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * Send an SMS notification (Mock function placeholder for MSG91/Twilio)
 * @param {String} phone - Recipient phone number
 * @param {String} message - Plain text message
 */
const sendSms = async (phone, message) => {
  if (!phone) return;
  console.log(`[SMS MOCK] To: ${phone} | Message: ${message}`);
  // In production: await axios.post('msg91-endpoint', { phone, message })
  return true;
};

/**
 * Send a WhatsApp notification (Mock function placeholder for WATI/Twilio)
 * @param {String} phone - Recipient phone number
 * @param {String} message - Plain text message
 */
const sendWhatsApp = async (phone, message) => {
  if (!phone) return;
  console.log(`[WhatsApp MOCK] To: ${phone} | Message: ${message}`);
  // In production: await axios.post('whatsapp-business-api', { phone, message })
  return true;
};

module.exports = {
  sendEmail,
  sendSms,
  sendWhatsApp
};
