require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');

    // Get all organizations
    const orgs = await Organization.find({});
    console.log(`Found ${orgs.length} organization(s):\n`);
    orgs.forEach(org => {
      console.log(`  - ${org.name}`);
      console.log(`    Slug: ${org.slug}`);
      console.log(`    Email: ${org.email}`);
      console.log(`    ID: ${org._id}\n`);
    });

    // Get all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} user(s):\n`);
    users.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    Name: ${user.profile?.firstName} ${user.profile?.lastName}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Status: ${user.status}`);
      console.log(`    Org ID: ${user.orgId}`);
      console.log(`    Has Password: ${!!user.passwordHash}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
