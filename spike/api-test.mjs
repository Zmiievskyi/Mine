/**
 * MineGNK API Spike
 * Tests Gonka and Hyperfusion APIs to verify data availability
 *
 * Run: node spike/api-test.mjs
 */

const GONKA_API = 'http://node1.gonka.ai:8000';
const HYPERFUSION_API = 'https://tracker.gonka.hyperfusion.io';

async function testGonkaAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('GONKA API TEST');
  console.log('='.repeat(60));

  const url = `${GONKA_API}/v1/epochs/current/participants`;
  console.log(`\nEndpoint: ${url}`);

  try {
    const start = Date.now();
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    const elapsed = Date.now() - start;

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response time: ${elapsed}ms`);

    if (!response.ok) {
      console.log('Error: Non-200 response');
      return null;
    }

    const data = await response.json();

    // Analyze structure
    console.log('\n--- Response Structure ---');
    console.log('Top-level keys:', Object.keys(data));

    if (data.active_participants) {
      const ap = data.active_participants;
      console.log('\nactive_participants keys:', Object.keys(ap));

      if (ap.participants && ap.participants.length > 0) {
        console.log(`\nParticipants count: ${ap.participants.length}`);
        console.log('\nFirst participant structure:');
        const first = ap.participants[0];
        console.log('  Keys:', Object.keys(first));
        console.log('  index:', first.index?.substring(0, 20) + '...');
        console.log('  weight:', first.weight);
        console.log('  models:', first.models);
        console.log('  inference_url:', first.inference_url?.substring(0, 40) + '...');
      }
    }

    if (data.validators && data.validators.length > 0) {
      console.log(`\nValidators count: ${data.validators.length}`);
      console.log('First validator keys:', Object.keys(data.validators[0]));
    }

    return data;

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function testHyperfusionAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('HYPERFUSION TRACKER API TEST');
  console.log('='.repeat(60));

  // Test health endpoint first
  const healthUrl = `${HYPERFUSION_API}/api/v1/hello`;
  console.log(`\nHealth check: ${healthUrl}`);

  try {
    const healthResp = await fetch(healthUrl, {
      signal: AbortSignal.timeout(10000)
    });
    console.log(`Health status: ${healthResp.status}`);
  } catch (e) {
    console.log(`Health check failed: ${e.message}`);
  }

  // Test inference endpoint
  const inferenceUrl = `${HYPERFUSION_API}/api/v1/inference/current`;
  console.log(`\nInference endpoint: ${inferenceUrl}`);

  try {
    const start = Date.now();
    const response = await fetch(inferenceUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    const elapsed = Date.now() - start;

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response time: ${elapsed}ms`);

    if (!response.ok) {
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200));
      return null;
    }

    const data = await response.json();

    console.log('\n--- Response Structure ---');

    if (Array.isArray(data)) {
      console.log(`Array with ${data.length} items`);
      if (data.length > 0) {
        console.log('First item keys:', Object.keys(data[0]));
        console.log('\nFirst item sample:');
        const first = data[0];
        for (const [key, value] of Object.entries(first)) {
          const display = typeof value === 'string' && value.length > 50
            ? value.substring(0, 50) + '...'
            : value;
          console.log(`  ${key}: ${display}`);
        }
      }
    } else {
      console.log('Top-level keys:', Object.keys(data));
      console.log('\nSample data:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
    }

    return data;

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function tryAlternativeEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('TRYING ALTERNATIVE ENDPOINTS');
  console.log('='.repeat(60));

  const endpoints = [
    `${HYPERFUSION_API}/api/v1/nodes`,
    `${HYPERFUSION_API}/api/v1/stats`,
    `${HYPERFUSION_API}/api/v1/participants`,
    `${HYPERFUSION_API}/api/nodes`,
    `${GONKA_API}/api/v1/epochs/latest`,
  ];

  for (const url of endpoints) {
    try {
      console.log(`\nTrying: ${url}`);
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { 'Accept': 'application/json' }
      });
      console.log(`  Status: ${resp.status}`);
      if (resp.ok) {
        const text = await resp.text();
        console.log(`  Response: ${text.substring(0, 100)}...`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('MineGNK API Spike');
  console.log('Testing external APIs...');
  console.log(`Time: ${new Date().toISOString()}`);

  const gonkaData = await testGonkaAPI();
  const hyperfusionData = await testHyperfusionAPI();
  await tryAlternativeEndpoints();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Gonka API: ${gonkaData ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Hyperfusion API: ${hyperfusionData ? 'SUCCESS' : 'NEEDS INVESTIGATION'}`);

  if (gonkaData?.active_participants?.participants) {
    console.log(`\nGonka nodes available: ${gonkaData.active_participants.participants.length}`);
  }
}

main().catch(console.error);
