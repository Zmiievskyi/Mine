/**
 * Save full API response samples for documentation
 */

import { writeFileSync } from 'fs';

const GONKA_API = 'http://node1.gonka.ai:8000';
const HYPERFUSION_API = 'https://tracker.gonka.hyperfusion.io';
const OUTPUT_DIR = './docs/api-samples';

async function saveGonkaSample() {
  console.log('Fetching Gonka API...');
  const url = `${GONKA_API}/v1/epochs/current/participants`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000)
  });

  const data = await response.json();

  // Save truncated version (first 3 participants, first 3 validators)
  const sample = {
    _meta: {
      fetched_at: new Date().toISOString(),
      endpoint: url,
      note: 'Truncated to 3 participants/validators for readability'
    },
    active_participants: {
      ...data.active_participants,
      participants: data.active_participants.participants.slice(0, 3)
    },
    addresses: data.addresses?.slice(0, 3),
    validators: data.validators?.slice(0, 3),
    excluded_participants: data.excluded_participants?.slice(0, 3),
    // Skip large fields
    active_participants_bytes: '[truncated]',
    proof_ops: '[truncated]',
    block: '[truncated]'
  };

  writeFileSync(
    `${OUTPUT_DIR}/gonka-participants.json`,
    JSON.stringify(sample, null, 2)
  );
  console.log(`Saved: ${OUTPUT_DIR}/gonka-participants.json`);
  console.log(`Total participants: ${data.active_participants.participants.length}`);
}

async function saveHyperfusionSample() {
  console.log('Fetching Hyperfusion API...');
  const url = `${HYPERFUSION_API}/api/v1/inference/current`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000)
  });

  const data = await response.json();

  // Save truncated version
  const sample = {
    _meta: {
      fetched_at: new Date().toISOString(),
      endpoint: url,
      note: 'Truncated to 3 participants for readability'
    },
    epoch_id: data.epoch_id,
    height: data.height,
    cached_at: data.cached_at,
    is_current: data.is_current,
    total_assigned_rewards_gnk: data.total_assigned_rewards_gnk,
    current_block_height: data.current_block_height,
    current_block_timestamp: data.current_block_timestamp,
    avg_block_time: data.avg_block_time,
    next_poc_start_block: data.next_poc_start_block,
    set_new_validators_block: data.set_new_validators_block,
    participants: data.participants?.slice(0, 3)
  };

  writeFileSync(
    `${OUTPUT_DIR}/hyperfusion-inference.json`,
    JSON.stringify(sample, null, 2)
  );
  console.log(`Saved: ${OUTPUT_DIR}/hyperfusion-inference.json`);
  console.log(`Total participants: ${data.participants?.length}`);
}

async function saveEpochSample() {
  console.log('Fetching Gonka epochs...');
  const url = `${GONKA_API}/api/v1/epochs/latest`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000)
  });

  const data = await response.json();

  writeFileSync(
    `${OUTPUT_DIR}/gonka-epochs-latest.json`,
    JSON.stringify(data, null, 2)
  );
  console.log(`Saved: ${OUTPUT_DIR}/gonka-epochs-latest.json`);
}

async function main() {
  await saveGonkaSample();
  await saveHyperfusionSample();
  await saveEpochSample();
  console.log('\nDone! Samples saved to', OUTPUT_DIR);
}

main().catch(console.error);
