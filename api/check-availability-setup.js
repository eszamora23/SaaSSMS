/**
 * Check and diagnose availability setup
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Service = require('./src/models/Service');
const Organization = require('./src/models/Organization');

async function checkAvailabilitySetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find the test organization
    const org = await Organization.findOne({ slug: 'test' });
    if (!org) {
      console.log('✗ Organization with slug "test" not found');
      process.exit(1);
    }
    console.log('✓ Found organization:', org.name);
    console.log('  Organization ID:', org._id);

    // Check business hours
    console.log('\n📅 Business Hours:');
    if (org.businessHours && org.businessHours.length > 0) {
      org.businessHours.forEach(bh => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log(`  ${days[bh.dayOfWeek]}: ${bh.start} - ${bh.end}`);
      });
    } else {
      console.log('  ⚠️  No business hours configured');
    }

    // Find services
    console.log('\n📦 Services:');
    const services = await Service.find({ orgId: org._id, active: true });
    if (services.length === 0) {
      console.log('  ✗ No active services found');
    } else {
      services.forEach(service => {
        console.log(`  ✓ ${service.name}`);
        console.log(`    ID: ${service._id}`);
        console.log(`    Duration: ${service.durationMinutes} minutes`);
        console.log(`    Max Slots: ${service.maxSlotsPerTimeSlot || 1}`);
      });
    }

    // Find workers
    console.log('\n👥 Workers:');
    const workers = await User.find({
      orgId: org._id,
      role: { $in: ['admin', 'worker'] },
      status: 'active'
    });

    if (workers.length === 0) {
      console.log('  ✗ No active workers/admins found');
    } else {
      for (const worker of workers) {
        console.log(`\n  Worker: ${worker.profile?.firstName} ${worker.profile?.lastName} (${worker.email})`);
        console.log(`    Role: ${worker.role}`);
        console.log(`    ID: ${worker._id}`);

        if (worker.workerProfile) {
          console.log(`    Booking Enabled: ${worker.workerProfile.bookingEnabled || false}`);
          console.log(`    Service IDs: ${worker.workerProfile.serviceIds?.length || 0}`);

          if (worker.workerProfile.availability && worker.workerProfile.availability.length > 0) {
            console.log('    Custom Availability:');
            worker.workerProfile.availability.forEach(avail => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              console.log(`      ${days[avail.dayOfWeek]}: ${avail.start} - ${avail.end}`);
            });
          } else {
            console.log('    ⚠️  No custom availability (will use org business hours)');
          }
        } else {
          console.log('    ✗ No workerProfile configured');
        }
      }
    }

    console.log('\n\n🔧 DIAGNOSIS:');

    // Diagnose issues
    const issues = [];
    const fixes = [];

    if (!org.businessHours || org.businessHours.length === 0) {
      issues.push('No business hours configured for organization');
      fixes.push('Set organization business hours');
    }

    if (services.length === 0) {
      issues.push('No active services found');
    }

    if (workers.length === 0) {
      issues.push('No active workers/admins found');
    } else {
      const workersWithBookingEnabled = workers.filter(w => w.workerProfile?.bookingEnabled);
      if (workersWithBookingEnabled.length === 0) {
        issues.push('No workers have booking enabled');
        fixes.push('Enable booking for at least one worker');
      }

      const workersWithAvailability = workers.filter(w =>
        w.workerProfile?.availability && w.workerProfile.availability.length > 0
      );

      if (workersWithAvailability.length === 0 && (!org.businessHours || org.businessHours.length === 0)) {
        issues.push('No availability configured (neither worker-specific nor org business hours)');
        fixes.push('Configure organization business hours or worker availability');
      }
    }

    if (issues.length > 0) {
      console.log('\n❌ Issues Found:');
      issues.forEach(issue => console.log(`  - ${issue}`));

      console.log('\n💡 Recommended Fixes:');
      fixes.forEach(fix => console.log(`  - ${fix}`));
    } else {
      console.log('\n✓ All looks good! If still no availability, check:');
      console.log('  - Workers have the service assigned to their serviceIds array');
      console.log('  - Time slots are not all in the past');
      console.log('  - Business hours cover the dates you\'re checking');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAvailabilitySetup();
