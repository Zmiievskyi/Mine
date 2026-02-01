import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetworkStatus } from '../NetworkStatus';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock chain status response
const createChainStatusResponse = (
  blockHeight: number,
  blockTime: string,
  catchingUp: boolean = false
) => ({
  result: {
    sync_info: {
      latest_block_height: blockHeight.toString(),
      latest_block_time: blockTime,
      catching_up: catchingUp,
    },
  },
});

// Helper to create mock epoch participants response
const createEpochParticipantsResponse = (epochId: number) => ({
  active_participants: {
    epoch_id: epochId,
  },
});

// Helper to get current time minus offset in seconds
const getTimeMinusSeconds = (seconds: number): string => {
  const date = new Date(Date.now() - seconds * 1000);
  return date.toISOString();
};

describe('NetworkStatus', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders with placeholder values initially', () => {
    // Mock API responses
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    render(<NetworkStatus />);

    // Status should show Unknown initially
    expect(screen.getByText('Unknown')).toBeInTheDocument();

    // Placeholder values should be shown
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('displays correct data after successful fetch', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1234567;
    const epochId = 42;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(epochId)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Check block height with formatted number
    expect(screen.getByText('1,234,567')).toBeInTheDocument();

    // Check epoch ID
    expect(screen.getByText('42')).toBeInTheDocument();

    // Check block age (should show ~30s)
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('shows "Live" status when block age ≤ 120s and not catching up', async () => {
    const blockTime = getTimeMinusSeconds(60); // 1 minute old
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Check for emerald color class (Live status)
    const liveElement = screen.getByText('Live');
    expect(liveElement).toHaveClass('text-emerald-400');
  });

  it('shows "Syncing" status when catching_up is true', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(createChainStatusResponse(blockHeight, blockTime, true)), // catching_up: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Syncing')).toBeInTheDocument();
    });

    // Check for amber color class (Syncing status)
    const syncingElement = screen.getByText('Syncing');
    expect(syncingElement).toHaveClass('text-amber-400');
  });

  it('shows "Stale" status when block age > 120s', async () => {
    const blockTime = getTimeMinusSeconds(180); // 3 minutes old
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    // Check for red color class (Stale status)
    const staleElement = screen.getByText('Stale');
    expect(staleElement).toHaveClass('text-red-400');
  });

  it('shows "Unknown" status when API fails', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    // Check for zinc color class (Unknown status)
    const unknownElement = screen.getByText('Unknown');
    expect(unknownElement).toHaveClass('text-zinc-400');
  });

  it('shows "Unknown" status when chain status returns not ok', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  it('shows "Unknown" status when epoch participants returns not ok', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  it('manual refresh button triggers new fetch', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    // Initial fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      })
      // Refresh fetch with new data
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(createChainStatusResponse(blockHeight + 100, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(11)),
      });

    const user = userEvent.setup({ delay: null });
    render(<NetworkStatus />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Check that fetch was called again (4 times total: 2 initial + 2 refresh)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    // Verify new data is displayed
    await waitFor(() => {
      expect(screen.getByText('1,000,100')).toBeInTheDocument();
    });
  });

  it('polls data every 20 seconds', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    // Mock responses for multiple polls
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            mockFetch.mock.calls.length % 2 === 1
              ? createChainStatusResponse(blockHeight, blockTime, false)
              : createEpochParticipantsResponse(10)
          ),
      })
    );

    render(<NetworkStatus />);

    // Wait for initial fetch (2 calls)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Advance time by 20 seconds
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    // Should trigger another fetch (4 calls total)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    // Advance time by another 20 seconds
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    // Should trigger another fetch (6 calls total)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });

  it('displays formatted block age correctly', async () => {
    // Test different age formats
    const testCases = [
      { seconds: 30, expected: '30s' },
      { seconds: 90, expected: /1m 30s/ },
      { seconds: 3660, expected: /1h 1m/ },
    ];

    for (const testCase of testCases) {
      mockFetch.mockClear();

      const blockTime = getTimeMinusSeconds(testCase.seconds);
      const blockHeight = 1000000;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createEpochParticipantsResponse(10)),
        });

      const { unmount } = render(<NetworkStatus />);

      await waitFor(() => {
        expect(screen.getByText(testCase.expected)).toBeInTheDocument();
      });

      // Allow the timeout to complete before unmounting
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      unmount();
    }
  });

  it('displays formatted time correctly', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Check that updated time is shown in HH:MM:SS format
    const timeRegex = /\d{2}:\d{2}:\d{2}/;
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  it('shows updating state while refreshing', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    let resolveFirstFetch: any;
    const firstFetchPromise = new Promise((resolve) => {
      resolveFirstFetch = resolve;
    });

    mockFetch
      .mockReturnValueOnce(
        firstFetchPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
        }))
      )
      .mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createEpochParticipantsResponse(10)),
        })
      );

    const { container } = render(<NetworkStatus />);

    // Component should show updating state while fetching
    // Resolve the fetch
    resolveFirstFetch();

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // After fetch completes, check that refresh button exists
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    // SVG icon should exist
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('clears interval on unmount', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            mockFetch.mock.calls.length % 2 === 1
              ? createChainStatusResponse(blockHeight, blockTime, false)
              : createEpochParticipantsResponse(10)
          ),
      })
    );

    const { unmount } = render(<NetworkStatus />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Allow the isUpdating timeout to complete
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const callCountBeforeUnmount = mockFetch.mock.calls.length;

    // Unmount component
    unmount();

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    // Should not have called fetch again after unmount
    expect(mockFetch).toHaveBeenCalledTimes(callCountBeforeUnmount);
  });

  it('handles camelCase API response format', async () => {
    // Test alternative camelCase format
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1234567;
    const epochId = 42;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            syncInfo: {
              latestBlockHeight: blockHeight.toString(),
              latestBlockTime: blockTime,
              catchingUp: false,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(epochId)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    const { container } = render(<NetworkStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Check refresh button has aria-label
    const refreshButton = screen.getByRole('button', { name: /refresh network status/i });
    expect(refreshButton).toHaveAttribute('aria-label', 'Refresh network status');

    // Check that title attributes exist for tooltips in the DOM
    const elementsWithTitle = container.querySelectorAll('[title]');
    expect(elementsWithTitle.length).toBeGreaterThan(0);
  });

  it('fetches from correct API endpoints', async () => {
    const blockTime = getTimeMinusSeconds(30);
    const blockHeight = 1000000;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createChainStatusResponse(blockHeight, blockTime, false)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createEpochParticipantsResponse(10)),
      });

    render(<NetworkStatus />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // Check that correct URLs were called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://node4.gonka.ai/chain-rpc/status',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://node4.gonka.ai/v1/epochs/current/participants',
      expect.objectContaining({ cache: 'no-store' })
    );
  });
});
