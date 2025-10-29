/**
 * Quick script to activate a user account for development
 * Usage: node activate-user.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const activateUser = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and activate user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    if (user.isActive) {
      console.log(`User already activated: ${email}`);
    } else {
      user.isActive = true;
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      console.log(`User activated successfully: ${email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organization: ${user.orgId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error activating user:', error.message);
    process.exit(1);
  }
};

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node activate-user.js <email>');
  console.error('Example: node activate-user.js estebanz@hudsonriversolar.com');
  process.exit(1);
}

activateUser(email);
