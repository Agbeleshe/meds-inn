import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const CHECK_INTERVAL = 20 * 60 * 1000; // 20 minutes

export const NetworkGuard: React.FC = () => {
  const lastCheckedRef = useRef<number>(0);

  const checkNetworkSpeed = async () => {
    // Prevent double-checking within 10 seconds (e.g. strict mode double mount)
    const now = Date.now();
    if (now - lastCheckedRef.current < 10000) return;
    lastCheckedRef.current = now;

    let isSlow = false;

    // 1. Check Network Information API (if supported)
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      const { effectiveType, rtt, downlink } = connection;
      // If connection type is 2g, slow-2g, 3g or round trip time is high, or downlink is very low
      if (
        ['slow-2g', '2g', '3g'].includes(effectiveType) ||
        (rtt && rtt > 1500) ||
        (downlink && downlink < 0.5)
      ) {
        isSlow = true;
      }
    }

    // 2. Perform an active latency check (ping test) to confirm
    if (!isSlow) {
      try {
        const startTime = performance.now();
        // Fetch favicon or a small asset with cache buster
        const response = await fetch(`/favicon.ico?cb=${now}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (response.ok) {
          const duration = performance.now() - startTime;
          // If a tiny favicon request takes longer than 2.0 seconds, network is bad
          if (duration > 2000) {
            isSlow = true;
          }
        } else {
          isSlow = true;
        }
      } catch (error) {
        // If fetch fails completely (offline or blocked), it's a bad/unstable network
        isSlow = true;
      }
    }

    if (isSlow) {
      toast.warning('Slow Network Detected', {
        description: 'Your network is bad and some functions might fail. Please connect to a stable network.',
        duration: 8000,
        id: 'network-guard-warning', // Prevent duplicate toast overlays
      });
    }
  };

  useEffect(() => {
    // Run initial check on mount
    checkNetworkSpeed();

    // Set up interval to run every 20 minutes
    const intervalId = setInterval(checkNetworkSpeed, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return null;
};
