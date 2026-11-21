import { useEffect, useState } from 'react';

// The current time, updated every intervalMs milliseconds, so the times shown on screen keep counting
export default function useNow(intervalMs) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
