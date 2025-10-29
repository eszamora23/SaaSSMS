/**
 * Enable booking for admin/worker users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');
const Organization = require('./src/models/Organization');

async function enableWorkerBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find the test organization
    const org = await Organization.findOne({ slug: 'test' });
    if (!org) {
      console.log('✗ Organization with slug "test" not found');
      process.exit(1);
    }

    // Get all services for this org
    const services = await Service.find({ orgId: org._id, active: true });
    const serviceIds = services.map(s => s._id);

    console.log(`Found ${services.length} active service(s)`);
    services.forEach(s => console.log(`  - ${s.name} (${s._id})`));

    // Find workers without booking enabled
    const workers = await User.find({
      orgId: org._id,
      role: { $in: ['admin', 'worker'] },
      status: 'active'
    });

    console.log(`\nFound ${workers.length} active worker(s)/admin(s)\n`);

    for (const worker of workers) {
      const name = `${worker.profile?.firstName || ''} ${worker.profile?.lastName || ''}`.trim() || worker.email;

      if (!worker.workerProfile) {
        worker.workerProfile = {};
      }

      // Enable booking
      worker.workerProfile.bookingEnabled = true;

      // Assign all services
      worker.workerProfile.serviceIds = serviceIds;

      // Set default availability (use org business hours if not set)
      if (!worker.workerProfile.availability || worker.workerProfile.availability.length === 0) {
        // Use organization business hours as default, or create a default schedule
        if (org.businessHours && org.businessHours.length > 0) {
          worker.workerProfile.availability = org.businessHours;
        } else {
          // Create default 9-5 Mon-Fri schedule
          worker.workerProfile.availability = [
            { dayOfWeek: 1, start: '09:00', end: '17:00' }, // Monday
            { dayOfWeek: 2, start: '09:00', end: '17:00' }, // Tuesday
            { dayOfWeek: 3, start: '09:00', end: '17:00' }, // Wednesday
            { dayOfWeek: 4, start: '09:00', end: '17:00' }, // Thursday
            { dayOfWeek: 5, start: '09:00', end: '17:00' }, // Friday
          ];
        }
      }

      const savedWorker = await worker.save();

      console.log(`✓ Enabled booking for: ${name}`);
      console.log(`  - Booking Enabled: true`);
      console.log(`  - Assigned ${serviceIds.length} service(s)`);

      if (savedWorker.workerProfile && savedWorker.workerProfile.availability) {
        console.log(`  - Availability: ${savedWorker.workerProfile.availability.length} time slots`);
        savedWorker.workerProfile.availability.forEach(avail => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          console.log(`      ${days[avail.dayOfWeek]}: ${avail.start} - ${avail.end}`);
        });
      }
      console.log('');
    }

    console.log('✅ All workers have been configured for booking!');
    console.log('\nYou should now see availability at http://test.localhost:3000/');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

enableWorkerBooking();
