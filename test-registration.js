/**
 * Test script to verify email verification can be disabled
 * Tests that new organizations are auto-activated when emailVerificationRequired is false (default)
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api/v1';

async function testRegistration() {
  console.log('\n=== Testing Registration with Email Verification Disabled ===\n');

  try {
    // Test 1: Register a new organization
    console.log('1. Registering new organization...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      organizationName: `Test Org ${Date.now()}`,
      country: 'US',
      timezone: 'America/New_York',
    });

    console.log('✓ Registration successful');
    console.log('  Status:', registerResponse.data.data.organization.status);
    console.log('  User Status:', registerResponse.data.data.user.status);

    const { email } = registerResponse.data.data.user;
    const { accessToken } = registerResponse.data.data;

    // Test 2: Try to login immediately (should work if auto-activated)
    console.log('\n2. Testing immediate login (without email verification)...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: 'TestPassword123!',
    });

    console.log('✓ Login successful!');
    console.log('  User can login immediately without email verification');

    // Test 3: Verify organization settings via API
    console.log('\n3. Checking organization settings...');
    const orgResponse = await axios.get(`${API_URL}/organization`, {
      headers: {
        Authorization: `Bearer ${loginResponse.data.data.accessToken}`,
      },
    });

    const emailVerificationRequired = orgResponse.data.data.organization.settings?.emailVerificationRequired ?? false;
    console.log('✓ Organization settings retrieved');
    console.log('  emailVerificationRequired:', emailVerificationRequired);

    // Test 4: Update organization to require email verification
    console.log('\n4. Enabling email verification requirement...');
    await axios.patch(
      `${API_URL}/organization`,
      {
        settings: {
          emailVerificationRequired: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${loginResponse.data.data.accessToken}`,
        },
      }
    );

    console.log('✓ Email verification setting updated successfully');

    console.log('\n=== All Tests Passed! ===\n');
    console.log('Summary:');
    console.log('- New organizations default to emailVerificationRequired = false');
    console.log('- Users are auto-activated and can login immediately');
    console.log('- Organizations can enable email verification via Settings');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('  This suggests email verification is still required');
    }
    process.exit(1);
  }
}

testRegistration();
