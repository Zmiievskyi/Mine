import { NextResponse } from 'next/server';
import { GONKA_ENDPOINTS, FRESH_BLOCK_THRESHOLD } from '@/lib/gonka/constants';
import { fetchWithTimeout } from '@/lib/gonka/fetch';

type NetworkState = 'live' | 'syncing' | 'stale' | 'unknown';

interface NetworkStatusResponse {
  status: NetworkState;
  blockHeight: number | null;
  blockAge: number | null;
  epochId: number | null;
  updatedAt: string;
}

export async function GET() {
  const updatedAt = new Date();

  try {
    const [chainRes, epochRes] = await Promise.all([
      fetchWithTimeout(GONKA_ENDPOINTS.chainStatus, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }),
      fetchWithTimeout(GONKA_ENDPOINTS.participants, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }),
    ]);

    if (!chainRes.ok || !epochRes.ok) {
      throw new Error('API request failed');
    }

    const chainData = await chainRes.json();
    const epochData = await epochRes.json();

    // Extract chain status
    const result = chainData?.result || chainData;
    const syncInfo = result?.sync_info || result?.syncInfo;
    const catchingUp = syncInfo?.catching_up ?? syncInfo?.catchingUp ?? false;
    const latestHeight = parseInt(
      syncInfo?.latest_block_height ?? syncInfo?.latestBlockHeight ?? '0',
      10
    );
    const latestTime = syncInfo?.latest_block_time ?? syncInfo?.latestBlockTime;

    // Calculate block age
    let blockAge: number | null = null;
    if (latestTime) {
      const blockDate = new Date(latestTime);
      const blockTimestamp = blockDate.getTime();
      if (!Number.isNaN(blockTimestamp)) {
        blockAge = (updatedAt.getTime() - blockTimestamp) / 1000;
      }
    }

    // Extract epoch from active_participants
    const epochId = epochData?.active_participants?.epoch_id ?? null;

    // Determine status
    let status: NetworkState = 'unknown';
    if (catchingUp) {
      status = 'syncing';
    } else if (blockAge !== null && blockAge <= FRESH_BLOCK_THRESHOLD) {
      status = 'live';
    } else if (blockAge !== null) {
      status = 'stale';
    }

    const response: NetworkStatusResponse = {
      status,
      blockHeight: latestHeight || null,
      blockAge,
      epochId,
      updatedAt: updatedAt.toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Network status API error:', error);

    const response: NetworkStatusResponse = {
      status: 'unknown',
      blockHeight: null,
      blockAge: null,
      epochId: null,
      updatedAt: updatedAt.toISOString(),
    };

    return NextResponse.json(response, {
      status: 200, // Still return 200 to allow client to show "unknown" state
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
