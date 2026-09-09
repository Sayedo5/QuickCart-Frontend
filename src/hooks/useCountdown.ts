import { useEffect, useState } from 'react';

/** Counts down from `seconds` and restarts whenever `key` changes. Returns remaining seconds. */
export function useCountdown(seconds: number, key: number): number {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, key]);
  return remaining;
}
