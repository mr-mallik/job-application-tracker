/**
 * Test script for /api/reminders/check endpoint
 *
 * This test validates that the reminder check endpoint:
 * 1. Returns a valid response structure
 * 2. Processes jobs with reminders enabled
 * 3. Handles errors gracefully
 *
 * Usage: node tests/test_reminder_check.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const ENDPOINT = '/api/reminders/check';

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Test: Reminder check endpoint returns valid response
 */
async function testReminderCheckResponse() {
  console.log('\n🧪 Test: Reminder check endpoint returns valid response');
  console.log('─'.repeat(60));

  try {
    const response = await makeRequest(`${API_URL}${ENDPOINT}`, 'POST');

    // Check status code
    if (response.status === 200) {
      console.log('✅ Status: 200 OK');
    } else {
      console.log(`❌ Status: ${response.status} (expected 200)`);
      return false;
    }

    // Check response structure
    const { data } = response;

    // Validate required fields
    const requiredFields = ['success', 'remindersSent', 'reminders'];
    const missingFields = requiredFields.filter((field) => !(field in data));

    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    console.log('✅ All required fields present');

    // Validate field types
    if (typeof data.success !== 'boolean') {
      console.log(`❌ Field 'success' should be boolean, got ${typeof data.success}`);
      return false;
    }
    console.log('✅ Field types valid');

    if (typeof data.remindersSent !== 'number') {
      console.log(`❌ Field 'remindersSent' should be number, got ${typeof data.remindersSent}`);
      return false;
    }

    if (!Array.isArray(data.reminders)) {
      console.log(`❌ Field 'reminders' should be array, got ${typeof data.reminders}`);
      return false;
    }

    // Check if reminders sent matches array length
    if (data.remindersSent !== data.reminders.length) {
      console.log(
        `❌ remindersSent (${data.remindersSent}) doesn't match reminders array length (${data.reminders.length})`
      );
      return false;
    }
    console.log('✅ remindersSent count matches array length');

    // Validate reminder objects structure (if any exist)
    if (data.reminders.length > 0) {
      const reminder = data.reminders[0];
      const reminderFields = ['jobId', 'jobTitle', 'company', 'daysUntilDeadline', 'userEmail'];
      const missingReminderFields = reminderFields.filter((field) => !(field in reminder));

      if (missingReminderFields.length > 0) {
        console.log(`❌ Reminder object missing fields: ${missingReminderFields.join(', ')}`);
        return false;
      }
      console.log('✅ Reminder objects have correct structure');
    }

    // Check for errors array (optional)
    if (data.errors && !Array.isArray(data.errors)) {
      console.log(`❌ Field 'errors' should be array if present, got ${typeof data.errors}`);
      return false;
    }

    // Report errors if present
    if (data.errors && data.errors.length > 0) {
      console.log(`⚠️  Errors occurred while processing:`);
      data.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Job ${err.jobId}: ${err.error}`);
      });
    }

    // Summary
    console.log('\n📊 Results:');
    console.log(`   Reminders sent: ${data.remindersSent}`);
    console.log(`   Errors: ${data.errors?.length || 0}`);
    console.log(`   Success: ${data.success}`);

    console.log('\n✅ TEST PASSED');
    return true;
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test: Endpoint accepts POST method
 */
async function testPostMethodSupported() {
  console.log('\n🧪 Test: Endpoint accepts POST method');
  console.log('─'.repeat(60));

  try {
    const response = await makeRequest(`${API_URL}${ENDPOINT}`, 'POST');

    if (response.status === 200) {
      console.log('✅ POST method accepted');
      return true;
    } else {
      console.log(`❌ POST method returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ POST request failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Reminder Check Endpoint Test Suite                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI URL: ${API_URL}${ENDPOINT}`);

  const tests = [
    { name: 'POST method supported', fn: testPostMethodSupported },
    { name: 'Response structure', fn: testReminderCheckResponse },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test threw error: ${error.message}`);
      failed++;
    }
  }

  // Final summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  ✅ Passed: ${passed}/${tests.length}`);
  console.log(`  ❌ Failed: ${failed}/${tests.length}`);

  if (failed === 0) {
    console.log('\n  🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n  ⚠️  Some tests failed\n');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testReminderCheckResponse, testPostMethodSupported };
