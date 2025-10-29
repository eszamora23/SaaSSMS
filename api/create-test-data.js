/**
 * Create Test Data Script
 * Populates database with realistic test data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Customer, Service, Appointment, User, Organization, Thread, Message, PhoneNumber } = require('./src/models');

const MONGODB_URI = process.env.MONGODB_URI;

// Test data
const testCustomers = [
  { name: 'John Doe', phone: '+15551234567', email: 'john.doe@example.com', smsConsent: true },
  { name: 'Jane Smith', phone: '+15559876543', email: 'jane.smith@example.com', smsConsent: true },
  { name: 'Robert Johnson', phone: '+15555555555', email: 'robert.j@example.com', smsConsent: true },
  { name: 'Maria Garcia', phone: '+15556667777', email: 'maria.g@example.com', smsConsent: true },
  { name: 'Michael Brown', phone: '+15554443333', email: 'michael.b@example.com', smsConsent: false },
  { name: 'Sarah Davis', phone: '+15552221111', email: 'sarah.d@example.com', smsConsent: true },
  { name: 'David Wilson', phone: '+15558889999', email: 'david.w@example.com', smsConsent: true },
  { name: 'Lisa Anderson', phone: '+15551112222', email: 'lisa.a@example.com', smsConsent: true },
  { name: 'James Martinez', phone: '+15553334444', email: 'james.m@example.com', smsConsent: true },
  { name: 'Jennifer Taylor', phone: '+15557778888', email: 'jennifer.t@example.com', smsConsent: false },
];

const testServices = [
  {
    name: '30-Min Consultation',
    description: 'Quick consultation session',
    durationMinutes: 30,
    priceAmount: 50,
    priceCurrency: 'USD',
    status: 'active',
    bufferBefore: 10,
    bufferAfter: 10,
  },
  {
    name: '1-Hour Session',
    description: 'Full session with detailed discussion',
    durationMinutes: 60,
    priceAmount: 100,
    priceCurrency: 'USD',
    status: 'active',
    bufferBefore: 15,
    bufferAfter: 15,
  },
  {
    name: 'Initial Assessment',
    description: 'First-time client assessment',
    durationMinutes: 45,
    priceAmount: 75,
    priceCurrency: 'USD',
    status: 'active',
    bufferBefore: 10,
    bufferAfter: 10,
  },
  {
    name: 'Follow-up Meeting',
    description: 'Follow-up consultation',
    durationMinutes: 30,
    priceAmount: 60,
    priceCurrency: 'USD',
    status: 'active',
    bufferBefore: 5,
    bufferAfter: 5,
  },
  {
    name: 'Extended Session',
    description: 'Extended 90-minute session',
    durationMinutes: 90,
    priceAmount: 150,
    priceCurrency: 'USD',
    status: 'active',
    bufferBefore: 20,
    bufferAfter: 20,
  },
];

async function createTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the first active user and organization
    const user = await User.findOne({ status: 'active' });
    if (!user) {
      console.log('❌ No active user found. Please register first.');
      process.exit(1);
    }

    const organization = await Organization.findById(user.orgId);
    if (!organization) {
      console.log('❌ No organization found.');
      process.exit(1);
    }

    console.log(`✅ Using organization: ${organization.name}`);
    console.log(`✅ Using user: ${user.email}`);

    const orgId = organization._id;
    const userId = user._id;

    // Clear existing test data
    console.log('\n🗑️  Clearing existing test data...');
    await Customer.deleteMany({ orgId });
    await Service.deleteMany({ orgId });
    await Appointment.deleteMany({ orgId });
    await Thread.deleteMany({ orgId });
    await Message.deleteMany({ orgId });
    console.log('✅ Cleared existing data');

    // Create customers
    console.log('\n👥 Creating customers...');
    const createdCustomers = [];
    for (const customerData of testCustomers) {
      const customer = await Customer.create({
        ...customerData,
        orgId,
        source: 'manual',
        tags: ['test-customer'],
      });
      createdCustomers.push(customer);
      console.log(`   ✓ Created: ${customer.name}`);
    }
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Create services
    console.log('\n🛠️  Creating services...');
    const createdServices = [];
    for (const serviceData of testServices) {
      const service = await Service.create({
        ...serviceData,
        orgId,
        createdBy: userId,
      });
      createdServices.push(service);
      console.log(`   ✓ Created: ${service.name}`);
    }
    console.log(`✅ Created ${createdServices.length} services`);

    // Create appointments for the next 2 weeks
    console.log('\n📅 Creating appointments...');
    const appointments = [];
    const statuses = ['pending', 'confirmed', 'confirmed', 'completed', 'canceled'];

    for (let day = -5; day < 10; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      date.setHours(9, 0, 0, 0);

      // Create 2-4 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < appointmentsPerDay; i++) {
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
        const service = createdServices[Math.floor(Math.random() * createdServices.length)];

        // Random time between 9 AM and 5 PM
        const hour = 9 + Math.floor(Math.random() * 8);
        const minute = Math.random() > 0.5 ? 0 : 30;

        const appointmentDate = new Date(date);
        appointmentDate.setHours(hour, minute, 0, 0);

        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);

        const status = statuses[Math.floor(Math.random() * statuses.length)];

        try {
          const appointment = await Appointment.create({
            orgId,
            customerId: customer._id,
            serviceId: service._id,
            workerId: userId,
            startTime: appointmentDate,
            endTime,
            status,
            notes: `Test appointment for ${customer.name}`,
            createdBy: userId,
          });
          appointments.push(appointment);
        } catch (err) {
          // Skip if time conflict
          if (!err.message.includes('conflict')) {
            console.error(`   ⚠ Error creating appointment: ${err.message}`);
          }
        }
      }
    }
    console.log(`✅ Created ${appointments.length} appointments`);

    // Create phone number for threads
    console.log('\n📱 Creating phone number...');
    let phoneNumber = await PhoneNumber.findOne({ orgId });
    if (!phoneNumber) {
      phoneNumber = await PhoneNumber.create({
        orgId,
        e164: '+15551234000',
        friendlyName: 'Test Number',
        twilioSid: 'PN' + Math.random().toString(36).substring(2, 15),
        capabilities: {
          voice: true,
          sms: true,
          mms: true,
        },
        status: 'active',
      });
      console.log(`   ✓ Created phone number: ${phoneNumber.e164}`);
    } else {
      console.log(`   ✓ Using existing phone number: ${phoneNumber.e164}`);
    }

    // Create message threads
    console.log('\n💬 Creating message threads...');
    const threads = [];
    const sampleMessages = [
      'Hi, I need to reschedule my appointment',
      'Thank you for the reminder!',
      'Can I book an appointment for next week?',
      'I\'ll be there at 2 PM',
      'Do you have any availability tomorrow?',
      'Thanks for the great session!',
      'I need to cancel my appointment',
      'What services do you offer?',
      'Can you call me back?',
      'Looking forward to our meeting',
    ];

    for (let i = 0; i < 8; i++) {
      const customer = createdCustomers[i];

      // Create thread
      const thread = await Thread.create({
        orgId,
        customerId: customer._id,
        customerPhone: customer.phone,
        customerName: customer.name,
        phoneNumberId: phoneNumber._id,
        status: i < 6 ? 'open' : 'closed',
        assignedTo: i % 2 === 0 ? userId : null,
        lastMessageAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      threads.push(thread);

      // Create 3-5 messages per thread
      const messageCount = Math.floor(Math.random() * 3) + 3;
      for (let j = 0; j < messageCount; j++) {
        const isInbound = j % 2 === 0;
        const messageTime = new Date(Date.now() - (messageCount - j) * 2 * 60 * 60 * 1000);

        await Message.create({
          orgId,
          threadId: thread._id,
          customerId: customer._id,
          phoneNumberId: phoneNumber._id,
          direction: isInbound ? 'inbound' : 'outbound',
          from: isInbound ? customer.phone : phoneNumber.e164,
          to: isInbound ? phoneNumber.e164 : customer.phone,
          body: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          status: isInbound ? 'delivered' : 'sent',
          sentBy: isInbound ? null : userId,
          createdAt: messageTime,
        });
      }

      // Update thread stats
      const messageStats = await Message.aggregate([
        { $match: { threadId: thread._id } },
        { $group: { _id: null, count: { $sum: 1 }, lastMessage: { $max: '$createdAt' } } },
      ]);

      if (messageStats.length > 0) {
        thread.messageCount = messageStats[0].count;
        thread.lastMessageAt = messageStats[0].lastMessage;

        const lastMsg = await Message.findOne({ threadId: thread._id }).sort({ createdAt: -1 });
        if (lastMsg) {
          thread.lastMessage = lastMsg.body;
        }

        await thread.save();
      }

      console.log(`   ✓ Created thread for ${customer.name} with ${messageCount} messages`);
    }
    console.log(`✅ Created ${threads.length} message threads`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Test Data Creation Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Customers: ${createdCustomers.length}`);
    console.log(`   • Services: ${createdServices.length}`);
    console.log(`   • Appointments: ${appointments.length}`);
    console.log(`   • Message Threads: ${threads.length}`);
    console.log(`   • Organization: ${organization.name}`);
    console.log(`   • User: ${user.email}`);
    console.log('='.repeat(60));
    console.log('\n✅ You can now test the UI with realistic data!');
    console.log(`🌐 Frontend: http://localhost:3000`);
    console.log(`🔐 Login: ${user.email}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

createTestData();
