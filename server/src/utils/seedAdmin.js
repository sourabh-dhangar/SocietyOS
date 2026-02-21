const User = require('../modules/core/models/userModel');
const getDefaultPermissions = require('./permissionDefaults');

/**
 * Seed Super Admin on server boot
 * Reads ALL credentials from .env — nothing hardcoded.
 */
const seedSuperAdmin = async () => {
  try {
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME;
    const lastName = process.env.SUPER_ADMIN_LAST_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const phone = process.env.SUPER_ADMIN_PHONE;

    if (!email || !password || !firstName || !lastName || !phone) {
      console.log('⚠️  Missing SUPER_ADMIN env vars (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD, PHONE) — skipping seed.');
      return;
    }

    // Check if super admin already exists
    const existing = await User.findOne({ userType: 'super_admin' });
    if (existing) {
      console.log('✅ Super Admin already exists:', existing.email);
      return;
    }

    const admin = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      userType: 'super_admin',
      societyId: null,
      permissions: getDefaultPermissions('super_admin'),
      isActive: true,
    });

    await admin.save();

    console.log(`🔑 Super Admin seeded: ${email}`);
  } catch (error) {
    console.error('❌ SeedSuperAdmin Error:', error.message);
  }
};

module.exports = seedSuperAdmin;
