const bcrypt = require('bcryptjs');
const User = require('../modules/core/models/userModel');

/**
 * Seed Super Admin on server boot
 * Reads credentials from .env and creates the super admin if not found.
 */
const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const phone = process.env.SUPER_ADMIN_PHONE;

    if (!email || !password) {
      console.log('⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env — skipping seed.');
      return;
    }

    // Check if super admin already exists
    const existing = await User.findOne({ userType: 'super_admin' });
    if (existing) {
      console.log('✅ Super Admin already exists:', existing.email);
      return;
    }

    // Pass raw password — the userModel pre-save hook handles hashing
    const admin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      phone: phone || '0000000000',
      password,
      userType: 'super_admin',
      societyId: null,
      permissions: {
        finance: { view: true, edit: true },
        security: { view: true, edit: true },
        notices: { view: true, edit: true },
        operations: { view: true, edit: true },
        governance: { view: true, edit: true },
        staffManagement: { view: true, edit: true },
        admin_assets: { view: true, edit: true },
      },
      isActive: true,
    });

    await admin.save();

    console.log(`🔑 Super Admin seeded: ${email}`);
  } catch (error) {
    console.error('❌ SeedSuperAdmin Error:', error.message);
  }
};

module.exports = seedSuperAdmin;
