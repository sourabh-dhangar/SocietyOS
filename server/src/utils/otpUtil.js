/**
 * OTP Utility
 * Generates a secure random 6-digit OTP.
 * Currently logs OTP to the backend console for testing.
 * 
 * TODO: Integrate a real SMS gateway (e.g., MSG91, Twilio)
 *       to send OTP to the user's phone number.
 *       When ready, call the SMS API inside `sendOtp()` below.
 */

/**
 * Generate a cryptographically random 6-digit OTP
 * @returns {string} A random 6-digit OTP string
 */
const generateOtp = () => {
  // Generate a random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Send OTP to the user's phone number.
 * Currently logs OTP to the backend console.
 * Replace the console.log with a real SMS API call when integrating.
 * 
 * @param {string} phone - The user's phone number
 * @param {string} otp   - The generated OTP
 * @returns {Promise<boolean>} Whether the OTP was sent successfully
 */
const sendOtp = async (phone, otp) => {
  try {
    // ──────────────────────────────────────────────
    // TODO: Replace this block with real SMS API
    // Example with MSG91:
    //   const response = await axios.post('https://api.msg91.com/...', {
    //     mobile: phone,
    //     otp: otp,
    //     authkey: process.env.MSG91_AUTH_KEY,
    //     template_id: process.env.MSG91_TEMPLATE_ID,
    //   });
    //   return response.data.type === 'success';
    //
    // Example with Twilio:
    //   const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    //   await client.messages.create({
    //     body: `Your Nakshatra OTP is: ${otp}`,
    //     from: process.env.TWILIO_PHONE,
    //     to: `+91${phone}`,
    //   });
    //   return true;
    // ──────────────────────────────────────────────

    // For now, log the OTP to the backend console
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${phone}:`, error.message);
    return false;
  }
};

module.exports = { generateOtp, sendOtp };
