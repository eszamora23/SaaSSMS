/**
 * Seed Demo Data - Apartment Rental Management
 *
 * Scenario: Property owner manages multiple apartments with current tenants
 * who need to connect with prospective roommates for tours without
 * the owner being a middleman.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');
const Customer = require('./src/models/Customer');
const Service = require('./src/models/Service');
const Appointment = require('./src/models/Appointment');
const Thread = require('./src/models/Thread');
const Message = require('./src/models/Message');

async function seedApartmentDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find the existing organization
    let org = await Organization.findOne();

    if (!org) {
      console.log('No organization found. Creating one...');
      org = await Organization.create({
        name: 'Prime Properties Management',
        slug: 'prime-properties',
        email: 'contact@primeproperties.com',
        phone: '+15551234567',
        country: 'US',
        timezone: 'America/New_York',
        businessHours: [
          { dayOfWeek: 1, start: '09:00', end: '18:00' }, // Monday
          { dayOfWeek: 2, start: '09:00', end: '18:00' }, // Tuesday
          { dayOfWeek: 3, start: '09:00', end: '18:00' }, // Wednesday
          { dayOfWeek: 4, start: '09:00', end: '18:00' }, // Thursday
          { dayOfWeek: 5, start: '09:00', end: '18:00' }, // Friday
          { dayOfWeek: 6, start: '10:00', end: '16:00' }, // Saturday
        ],
        status: 'active',
      });
      console.log(`✓ Created organization: ${org.name}\n`);
    } else {
      console.log(`✓ Found organization: ${org.name}`);
      console.log(`  Organization ID: ${org._id}\n`);
    }

    // Clear existing demo data
    console.log('Clearing existing demo data...');
    await User.deleteMany({ orgId: org._id });
    await Customer.deleteMany({ orgId: org._id });
    await Service.deleteMany({ orgId: org._id });
    await Appointment.deleteMany({ orgId: org._id });
    await Thread.deleteMany({ orgId: org._id });
    await Message.deleteMany({ orgId: org._id });
    console.log('✓ Cleared existing data\n');

    // 1. Create Property Owner (Admin)
    console.log('Creating property owner (admin)...');
    const passwordHash = await bcrypt.hash('demo123', 12);

    const owner = await User.create({
      orgId: org._id,
      email: 'owner@primeproperties.com',
      passwordHash,
      profile: {
        firstName: 'Michael',
        lastName: 'Rodriguez',
        phone: '+15551234567',
      },
      role: 'admin',
      status: 'active',
      workerProfile: {
        skills: ['Property Management', 'Leasing', 'Tenant Relations'],
        bookingEnabled: true,
        bio: 'Property owner with 10+ years of experience in residential real estate.',
        serviceIds: [],
        availability: [
          { dayOfWeek: 1, start: '09:00', end: '18:00' },
          { dayOfWeek: 2, start: '09:00', end: '18:00' },
          { dayOfWeek: 3, start: '09:00', end: '18:00' },
          { dayOfWeek: 4, start: '09:00', end: '18:00' },
          { dayOfWeek: 5, start: '09:00', end: '18:00' },
          { dayOfWeek: 6, start: '10:00', end: '16:00' },
        ],
      },
    });
    console.log(`✓ Created property owner: ${owner.fullName}`);
    console.log(`  Email: ${owner.email} | Password: demo123\n`);

    // 2. Create Current Tenants (Workers who can show apartments)
    console.log('Creating current tenants...');

    const tenant1 = await User.create({
      orgId: org._id,
      email: 'sarah.chen@email.com',
      passwordHash,
      profile: {
        firstName: 'Sarah',
        lastName: 'Chen',
        phone: '60012345',
      },
      role: 'worker',
      status: 'active',
      workerProfile: {
        skills: ['Apartment 301A', 'Downtown Location'],
        bookingEnabled: true,
        bio: 'Current tenant at Apt 301A. Happy to show the available room and answer questions about the neighborhood.',
        serviceIds: [],
        availability: [
          { dayOfWeek: 2, start: '18:00', end: '21:00' }, // Tuesday evening
          { dayOfWeek: 4, start: '18:00', end: '21:00' }, // Thursday evening
          { dayOfWeek: 6, start: '10:00', end: '18:00' }, // Saturday
          { dayOfWeek: 0, start: '12:00', end: '17:00' }, // Sunday
        ],
      },
    });
    console.log(`✓ Created tenant: ${tenant1.fullName} - Apartment 301A`);

    const tenant2 = await User.create({
      orgId: org._id,
      email: 'james.thompson@email.com',
      passwordHash,
      profile: {
        firstName: 'James',
        lastName: 'Thompson',
        phone: '60023456',
      },
      role: 'worker',
      status: 'active',
      workerProfile: {
        skills: ['Apartment 205B', 'Pet-Friendly'],
        bookingEnabled: true,
        bio: 'Living in Apt 205B for 2 years. Looking for a responsible roommate. Pet-friendly apartment.',
        serviceIds: [],
        availability: [
          { dayOfWeek: 1, start: '17:00', end: '20:00' }, // Monday evening
          { dayOfWeek: 3, start: '17:00', end: '20:00' }, // Wednesday evening
          { dayOfWeek: 6, start: '11:00', end: '19:00' }, // Saturday
        ],
      },
    });
    console.log(`✓ Created tenant: ${tenant2.fullName} - Apartment 205B`);

    const tenant3 = await User.create({
      orgId: org._id,
      email: 'emily.patel@email.com',
      passwordHash,
      profile: {
        firstName: 'Emily',
        lastName: 'Patel',
        phone: '60034567',
      },
      role: 'worker',
      status: 'active',
      workerProfile: {
        skills: ['Apartment 402C', 'Near Metro'],
        bookingEnabled: true,
        bio: 'Apartment 402C tenant. Great building with amazing views. Looking for a clean and quiet roommate.',
        serviceIds: [],
        availability: [
          { dayOfWeek: 2, start: '19:00', end: '21:00' }, // Tuesday evening
          { dayOfWeek: 5, start: '18:00', end: '21:00' }, // Friday evening
          { dayOfWeek: 0, start: '13:00', end: '18:00' }, // Sunday
        ],
      },
    });
    console.log(`✓ Created tenant: ${tenant3.fullName} - Apartment 402C\n`);

    // 3. Create Services (Different types of apartment viewings/tours)
    console.log('Creating services...');

    const services = await Service.create([
      {
        orgId: org._id,
        name: 'Apartment 301A - Room Viewing',
        description: '2BR/1BA downtown apartment. Spacious room available with shared living space. $850/month + utilities. Near shops, restaurants, and public transit.',
        durationMinutes: 30,
        price: { amount: 0, currency: 'USD' },
        displayFreeLabel: false,
        bufferBefore: 0,
        bufferAfter: 15,
        location: 'in-person',
        active: true,
        color: '#2196F3',
        maxSlotsPerTimeSlot: 3,
      },
      {
        orgId: org._id,
        name: 'Apartment 205B - Pet-Friendly Room Tour',
        description: '3BR/2BA pet-friendly apartment. Large bedroom available with private bathroom. $950/month includes utilities. Dogs and cats welcome!',
        durationMinutes: 45,
        price: { amount: 0, currency: 'USD' },
        displayFreeLabel: false,
        bufferBefore: 0,
        bufferAfter: 15,
        location: 'in-person',
        active: true,
        color: '#4CAF50',
        maxSlotsPerTimeSlot: 2,
      },
      {
        orgId: org._id,
        name: 'Apartment 402C - Premium View Tour',
        description: '2BR/2BA luxury apartment on 4th floor with city views. Modern kitchen, in-unit washer/dryer. $1,200/month + utilities.',
        durationMinutes: 45,
        price: { amount: 0, currency: 'USD' },
        displayFreeLabel: false,
        bufferBefore: 0,
        bufferAfter: 15,
        location: 'in-person',
        active: true,
        color: '#FF9800',
        maxSlotsPerTimeSlot: 2,
      },
      {
        orgId: org._id,
        name: 'Virtual Tour - All Properties',
        description: 'Video tour of available apartments via video call. Perfect for out-of-state prospects or initial screening before in-person visit.',
        durationMinutes: 20,
        price: { amount: 0, currency: 'USD' },
        displayFreeLabel: true,
        bufferBefore: 0,
        bufferAfter: 10,
        location: 'virtual',
        active: true,
        color: '#9C27B0',
        maxSlotsPerTimeSlot: 5,
      },
    ]);

    console.log(`✓ Created ${services.length} services`);
    services.forEach(s => console.log(`  - ${s.name}`));
    console.log('');

    // Assign services to appropriate tenants and owner
    await User.updateOne(
      { _id: tenant1._id },
      { $set: { 'workerProfile.serviceIds': [services[0]._id, services[3]._id] } }
    );

    await User.updateOne(
      { _id: tenant2._id },
      { $set: { 'workerProfile.serviceIds': [services[1]._id, services[3]._id] } }
    );

    await User.updateOne(
      { _id: tenant3._id },
      { $set: { 'workerProfile.serviceIds': [services[2]._id, services[3]._id] } }
    );

    await User.updateOne(
      { _id: owner._id },
      { $set: { 'workerProfile.serviceIds': services.map(s => s._id) } }
    );

    console.log('✓ Assigned services to tenants and owner\n');

    // 4. Create Prospective Tenants (Customers)
    console.log('Creating prospective tenants (customers)...');

    const customers = await Customer.create([
      {
        orgId: org._id,
        name: 'Jessica Martinez',
        phone: '60198765',
        email: 'jessica.martinez@email.com',
        source: 'manual',
        tags: ['Looking for roommate', 'Young professional', 'Prefers downtown'],
        consents: {
          smsOptIn: { granted: true, at: new Date(), method: 'explicit' },
          emailOptIn: { granted: true, at: new Date(), method: 'explicit' },
        },
      },
      {
        orgId: org._id,
        name: 'David Kim',
        phone: '60187654',
        email: 'david.kim@email.com',
        source: 'booking',
        tags: ['Has pets', 'Dog owner', 'Looking ASAP'],
        consents: {
          smsOptIn: { granted: true, at: new Date(), method: 'explicit' },
        },
      },
      {
        orgId: org._id,
        name: 'Amanda Foster',
        phone: '60176543',
        email: 'amanda.foster@email.com',
        source: 'manual',
        tags: ['Graduate student', 'Quiet', 'Non-smoker'],
        consents: {
          smsOptIn: { granted: true, at: new Date(), method: 'explicit' },
        },
      },
      {
        orgId: org._id,
        name: 'Ryan Cooper',
        phone: '60165432',
        email: 'ryan.cooper@email.com',
        source: 'booking',
        tags: ['Young professional', 'Works from home', 'Prefers quiet'],
        consents: {
          smsOptIn: { granted: true, at: new Date(), method: 'explicit' },
        },
      },
      {
        orgId: org._id,
        name: 'Maria Gonzalez',
        phone: '60154321',
        email: 'maria.gonzalez@email.com',
        source: 'sms_inbound',
        tags: ['Relocating', 'Out of state', 'Urgent'],
        consents: {
          smsOptIn: { granted: true, at: new Date(), method: 'implied' },
        },
      },
    ]);

    console.log(`✓ Created ${customers.length} prospective tenants`);
    customers.forEach(c => console.log(`  - ${c.name} (${c.phone})`));
    console.log('');

    // 5. Create Appointments (Scheduled tours)
    console.log('Creating scheduled appointments...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(18, 30, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 5);
    nextWeek.setHours(15, 0, 0, 0);

    const appointments = await Appointment.create([
      {
        orgId: org._id,
        customerId: customers[0]._id,
        serviceId: services[0]._id,
        workerId: tenant1._id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 30 * 60000),
        status: 'confirmed',
        notes: 'Jessica is interested in moving in next month. Prefers a quiet roommate.',
        source: 'public_booking',
        customerInfo: {
          name: customers[0].name,
          email: customers[0].email,
          phone: customers[0].phone,
        },
      },
      {
        orgId: org._id,
        customerId: customers[1]._id,
        serviceId: services[1]._id,
        workerId: tenant2._id,
        startTime: dayAfter,
        endTime: new Date(dayAfter.getTime() + 45 * 60000),
        status: 'confirmed',
        notes: 'Has a medium-sized dog. Very interested in pet-friendly apartment.',
        source: 'public_booking',
        customerInfo: {
          name: customers[1].name,
          email: customers[1].email,
          phone: customers[1].phone,
        },
      },
      {
        orgId: org._id,
        customerId: customers[2]._id,
        serviceId: services[2]._id,
        workerId: tenant3._id,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 45 * 60000),
        status: 'pending',
        notes: 'Graduate student starting in the fall. Looking for long-term rental.',
        source: 'manual',
        customerInfo: {
          name: customers[2].name,
          email: customers[2].email,
          phone: customers[2].phone,
        },
      },
    ]);

    console.log(`✓ Created ${appointments.length} scheduled tours`);
    appointments.forEach(apt => {
      console.log(`  - ${apt.customerInfo.name} viewing on ${apt.startTime.toLocaleDateString()}`);
    });
    console.log('');

    // 6. Create SMS Threads and Messages
    console.log('Creating SMS conversations...');

    // Thread 1: Jessica inquiring about Apt 301A
    const thread1 = await Thread.create({
      orgId: org._id,
      customerPhone: customers[0].phone,
      customerName: customers[0].name,
      customerId: customers[0]._id,
      assignedTo: tenant1._id,
      status: 'open',
      lastMessageAt: new Date(now.getTime() - 2 * 60 * 60000), // 2 hours ago
      lastMessage: "Perfect! I'll see you tomorrow at 2 PM. Looking forward to it!",
      unreadCount: 0,
    });

    await Message.create([
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'inbound',
        from: customers[0].phone,
        to: '+15551234567',
        body: 'Hi! I saw your listing for Apt 301A. Is the room still available?',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 4 * 60 * 60000), // 4 hours ago
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[0].phone,
        body: 'Hi Jessica! Yes, the room is still available. Would you like to schedule a tour?',
        status: 'delivered',
        sentBy: tenant1._id,
        timestamp: new Date(now.getTime() - 3.5 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'inbound',
        from: customers[0].phone,
        to: '+15551234567',
        body: "Yes please! I'm available tomorrow afternoon. What times work for you?",
        status: 'delivered',
        timestamp: new Date(now.getTime() - 3 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[0].phone,
        body: 'I have 2 PM or 4 PM available tomorrow. The tour takes about 30 minutes. Which works better?',
        status: 'delivered',
        sentBy: tenant1._id,
        timestamp: new Date(now.getTime() - 2.5 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'inbound',
        from: customers[0].phone,
        to: '+15551234567',
        body: "2 PM works great! What's the address?",
        status: 'delivered',
        timestamp: new Date(now.getTime() - 2.2 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[0].phone,
        body: "Great! It's 301 Elm Street, Apt 301A. I'll meet you in the lobby. See you tomorrow!",
        status: 'delivered',
        sentBy: tenant1._id,
        timestamp: new Date(now.getTime() - 2 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread1._id,
        customerId: customers[0]._id,
        direction: 'inbound',
        from: customers[0].phone,
        to: '+15551234567',
        body: "Perfect! I'll see you tomorrow at 2 PM. Looking forward to it!",
        status: 'delivered',
        timestamp: new Date(now.getTime() - 2 * 60 * 60000),
      },
    ]);

    console.log(`✓ Created conversation: Jessica Martinez (${customers[0].phone})`);

    // Thread 2: David asking about pet policy
    const thread2 = await Thread.create({
      orgId: org._id,
      customerPhone: customers[1].phone,
      customerName: customers[1].name,
      customerId: customers[1]._id,
      assignedTo: tenant2._id,
      status: 'open',
      lastMessageAt: new Date(now.getTime() - 30 * 60000), // 30 min ago
      lastMessage: "Sounds perfect! I'll book a tour through your website. Thanks!",
      unreadCount: 0,
    });

    await Message.create([
      {
        orgId: org._id,
        threadId: thread2._id,
        customerId: customers[1]._id,
        direction: 'inbound',
        from: customers[1].phone,
        to: '+15551234567',
        body: 'Hi, I have a 45lb golden retriever. Is he allowed in Apt 205B?',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 2 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread2._id,
        customerId: customers[1]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[1].phone,
        body: 'Absolutely! We love dogs here. There is a one-time pet deposit of $300 (refundable). The apartment has hardwood floors which is great for pets.',
        status: 'delivered',
        sentBy: tenant2._id,
        timestamp: new Date(now.getTime() - 1.5 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread2._id,
        customerId: customers[1]._id,
        direction: 'inbound',
        from: customers[1].phone,
        to: '+15551234567',
        body: 'That works for me! Can I see the apartment this week?',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 1 * 60 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread2._id,
        customerId: customers[1]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[1].phone,
        body: "Sure! I'm free Wednesday evening around 6:30 PM or Saturday afternoon. What works for you?",
        status: 'delivered',
        sentBy: tenant2._id,
        timestamp: new Date(now.getTime() - 45 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread2._id,
        customerId: customers[1]._id,
        direction: 'inbound',
        from: customers[1].phone,
        to: '+15551234567',
        body: "Sounds perfect! I'll book a tour through your website. Thanks!",
        status: 'delivered',
        timestamp: new Date(now.getTime() - 30 * 60000),
      },
    ]);

    console.log(`✓ Created conversation: David Kim (${customers[1].phone})`);

    // Thread 3: Maria asking general questions (new prospect)
    const thread3 = await Thread.create({
      orgId: org._id,
      customerPhone: customers[4].phone,
      customerName: customers[4].name,
      customerId: customers[4]._id,
      assignedTo: owner._id,
      status: 'open',
      lastMessageAt: new Date(now.getTime() - 10 * 60000), // 10 min ago
      lastMessage: "I'm relocating from California. Do you offer virtual tours first?",
      unreadCount: 1,
    });

    await Message.create([
      {
        orgId: org._id,
        threadId: thread3._id,
        customerId: customers[4]._id,
        direction: 'inbound',
        from: customers[4].phone,
        to: '+15551234567',
        body: 'Hi! I need to find a place by next month. What apartments do you have available?',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 45 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread3._id,
        customerId: customers[4]._id,
        direction: 'outbound',
        from: '+15551234567',
        to: customers[4].phone,
        body: 'Hello! We currently have 3 rooms available: a downtown 2BR ($850/mo), a pet-friendly 3BR ($950/mo), and a luxury 2BR with views ($1200/mo). All utilities negotiable. What are you looking for?',
        status: 'delivered',
        sentBy: owner._id,
        timestamp: new Date(now.getTime() - 30 * 60000),
      },
      {
        orgId: org._id,
        threadId: thread3._id,
        customerId: customers[4]._id,
        direction: 'inbound',
        from: customers[4].phone,
        to: '+15551234567',
        body: "I'm relocating from California. Do you offer virtual tours first?",
        status: 'delivered',
        timestamp: new Date(now.getTime() - 10 * 60000),
      },
    ]);

    console.log(`✓ Created conversation: Maria Gonzalez (${customers[4].phone}) - UNREAD\n`);

    // Final Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ APARTMENT RENTAL DEMO DATA SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🏢 ORGANIZATION:');
    console.log(`   Name: ${org.name}`);
    console.log(`   Slug: ${org.slug}`);
    console.log(`   URL: http://${org.slug}.localhost:3000/\n`);

    console.log('👤 LOGIN CREDENTIALS:');
    console.log(`   Property Owner: ${owner.email} / demo123`);
    console.log(`   Tenant (Sarah): ${tenant1.email} / demo123`);
    console.log(`   Tenant (James): ${tenant2.email} / demo123`);
    console.log(`   Tenant (Emily): ${tenant3.email} / demo123\n`);

    console.log('🎯 DEMO HIGHLIGHTS:');
    console.log('   ✓ 3 current tenants with availability schedules');
    console.log('   ✓ 4 apartment tour services (3 in-person + 1 virtual)');
    console.log('   ✓ 5 prospective tenants (customers) in the system');
    console.log('   ✓ 3 scheduled tours showing direct tenant-prospect connection');
    console.log('   ✓ 3 realistic SMS conversations');
    console.log('   ✓ 1 unread message requiring response\n');

    console.log('💡 KEY SELLING POINTS FOR YOUR PROSPECT:');
    console.log('   1. Tenants can schedule tours directly without owner involvement');
    console.log('   2. Each tenant sets their own availability for showing rooms');
    console.log('   3. Prospects can book tours 24/7 through the public booking page');
    console.log('   4. SMS system allows communication without sharing personal numbers');
    console.log('   5. Owner has full visibility and can step in when needed');
    console.log('   6. Virtual tours for out-of-state prospects');
    console.log('   7. Group bookings support (multiple prospects can tour together)\n');

    console.log('🚀 NEXT STEPS:');
    console.log('   1. Login as property owner to see the full admin dashboard');
    console.log('   2. Check the Messages tab to see SMS conversations');
    console.log('   3. View Appointments to see scheduled tours');
    console.log(`   4. Visit http://${org.slug}.localhost:3000/ to see the public booking page`);
    console.log('   5. Try booking a tour as a new prospect!\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedApartmentDemo();
