'use client';

import { useState, useEffect, useCallback } from 'react';

const CHAIN_STATUS_URL = 'https://node4.gonka.ai/chain-rpc/status';
const EPOCH_PARTICIPANTS_URL = 'https://node4.gonka.ai/v1/epochs/current/participants';
const POLL_INTERVAL = 20000; // 20 seconds
const FRESH_THRESHOLD = 120; // seconds

type NetworkState = 'live' | 'syncing' | 'stale' | 'unknown';

interface NetworkData {
  status: NetworkState;
  blockHeight: number | null;
  blockAge: number | null;
  epochId: number | null;
  updatedAt: Date | null;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function NetworkStatus() {
  // Start with null to avoid hydration mismatch (no date rendered on server)
  const [data, setData] = useState<NetworkData>({
    status: 'unknown',
    blockHeight: null,
    blockAge: null,
    epochId: null,
    updatedAt: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setIsUpdating(true);
    const updatedAt = new Date();

    try {
      const [chainRes, epochRes] = await Promise.all([
        fetch(CHAIN_STATUS_URL, { cache: 'no-store' }),
        fetch(EPOCH_PARTICIPANTS_URL, { cache: 'no-store' }),
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
      const latestHeight = parseInt(syncInfo?.latest_block_height ?? syncInfo?.latestBlockHeight ?? '0', 10);
      const latestTime = syncInfo?.latest_block_time ?? syncInfo?.latestBlockTime;

      // Calculate block age
      let blockAge: number | null = null;
      if (latestTime) {
        const blockDate = new Date(latestTime);
        blockAge = (updatedAt.getTime() - blockDate.getTime()) / 1000;
      }

      // Extract epoch from active_participants
      const epochId = epochData?.active_participants?.epoch_id ?? null;

      // Determine status
      let status: NetworkState = 'unknown';
      if (catchingUp) {
        status = 'syncing';
      } else if (blockAge !== null && blockAge <= FRESH_THRESHOLD) {
        status = 'live';
      } else if (blockAge !== null) {
        status = 'stale';
      }

      setData({
        status,
        blockHeight: latestHeight || null,
        blockAge,
        epochId,
        updatedAt,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        status: 'unknown',
        updatedAt,
      }));
    } finally {
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statusConfig = {
    live: {
      label: 'Live',
      dotClass: 'bg-emerald-500',
      pulseClass: 'bg-emerald-400',
      textClass: 'text-emerald-400',
    },
    syncing: {
      label: 'Syncing',
      dotClass: 'bg-amber-500',
      pulseClass: 'bg-amber-400',
      textClass: 'text-amber-400',
    },
    stale: {
      label: 'Stale',
      dotClass: 'bg-red-500',
      pulseClass: 'bg-red-400',
      textClass: 'text-red-400',
    },
    unknown: {
      label: 'Unknown',
      dotClass: 'bg-zinc-500',
      pulseClass: 'bg-zinc-400',
      textClass: 'text-zinc-400',
    },
  };

  const config = statusConfig[data.status];

  return (
    <div className="w-full bg-card/60 backdrop-blur-sm border-b border-border/50">
      <div className="mx-auto max-w-screen-xl px-4 md:px-12 lg:px-20">
        <div className="flex items-center justify-between h-8 text-xs">
          {/* Left: Status indicator */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Status */}
            <div className="flex items-center gap-2" title="Network status based on block freshness">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.pulseClass}`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClass}`}
                />
              </span>
              <span className={`font-medium ${config.textClass}`}>
                {config.label}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-3 w-px bg-border" />

            {/* Block Height */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-muted-foreground"
              title="Latest block height"
            >
              <span className="text-zinc-500">Block</span>
              <span
                className={`font-mono font-medium text-foreground transition-opacity duration-300 ${
                  isUpdating ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {data.blockHeight ? formatNumber(data.blockHeight) : '—'}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-3 w-px bg-border" />

            {/* Block Age */}
            <div
              className="hidden md:flex items-center gap-1.5 text-muted-foreground"
              title="Time since last block"
            >
              <span className="text-zinc-500">Age</span>
              <span
                className={`font-mono font-medium text-foreground transition-opacity duration-300 ${
                  isUpdating ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {formatAge(data.blockAge)}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-3 w-px bg-border" />

            {/* Epoch */}
            <div
              className="hidden lg:flex items-center gap-1.5 text-muted-foreground"
              title="Current network epoch"
            >
              <span className="text-zinc-500">Epoch</span>
              <span
                className={`font-mono font-medium text-foreground transition-opacity duration-300 ${
                  isUpdating ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {data.epochId ?? '—'}
              </span>
            </div>
          </div>

          {/* Right: Updated time + refresh indicator */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden xs:inline text-zinc-500">Updated</span>
            <span
              className={`font-mono text-zinc-400 transition-opacity duration-300 ${
                isUpdating ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {formatTime(data.updatedAt)}
            </span>
            <button
              onClick={fetchData}
              className="p-1 hover:bg-border/50 rounded transition-colors"
              title="Refresh now"
              aria-label="Refresh network status"
            >
              <svg
                className={`w-3 h-3 text-zinc-500 hover:text-foreground transition-transform ${
                  isUpdating ? 'animate-spin' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
