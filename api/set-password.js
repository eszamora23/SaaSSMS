/**
 * Set User Password Script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function setPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const password = 'demo123';

    const users = await User.find({});
    console.log(`Found ${users.length} users. Setting password to "demo123" for all...\n`);

    for (const user of users) {
      // Set raw password - the pre-save hook will hash it
      user.passwordHash = password;
      await user.save();
      console.log(`✅ Password set for: ${user.email} (${user.role})`);
    }

    console.log('\n✅ All passwords have been set to: demo123\n');
    console.log('You can now login with:');
    users.forEach(user => {
      console.log(`  - ${user.email} / demo123`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

setPassword();
