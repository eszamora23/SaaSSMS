const axios = require('axios');

async function testAutoActivation() {
  const email = `test${Date.now()}@example.com`;

  try {
    console.log('=== Testing Auto-Activation Feature ===\n');
    console.log(`Testing with email: ${email}\n`);

    // Step 1: Register
    console.log('Step 1: Registering new organization...');
    const registerRes = await axios.post('http://localhost:4000/api/v1/auth/register', {
      email,
      password: 'TestPassword123!',
      organizationName: `Test Org ${Date.now()}`,
      country: 'US',
      timezone: 'America/New_York'
    });

    console.log('✓ Registration successful!');
    console.log(`  Organization status: ${registerRes.data.data.organization.status}`);
    console.log(`  User status: ${registerRes.data.data.user.status}`);

    // Step 2: Try immediate login
    console.log('\nStep 2: Attempting immediate login (without email verification)...');
    const loginRes = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email,
      password: 'TestPassword123!'
    });

    console.log('✓ Login successful!');
    console.log('  User can login immediately without email verification\n');

    console.log('=== TEST PASSED ===');
    console.log('Email verification is properly disabled by default!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ TEST FAILED');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Error: ${error.response.data.error.message}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    process.exit(1);
  }
}

testAutoActivation();
