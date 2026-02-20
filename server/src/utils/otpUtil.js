/**
 * OTP Utility — Mock for Development
 * Replace with real SMS gateway (e.g., MSG91, Twilio) in production.
 */

const generateMockOtp = () => {
  const otp = '123456';
  console.log(`📱 Mock OTP sent: ${otp}`);
  return otp;
};

module.exports = { generateMockOtp };
