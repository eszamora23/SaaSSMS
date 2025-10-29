/**
 * MongoDB Connection Test
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Connection state:', mongoose.connection.readyState); // 1 = connected

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.length);

    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }

    console.log('\n✨ MongoDB is ready to use!\n');

  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error('   Error:', error.message);

    if (error.message.includes('Authentication failed')) {
      console.error('\n💡 Tip: Check your MongoDB username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check your internet connection and MongoDB cluster URL');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connection closed');
  }
}

testConnection();
