import { useState, useEffect, useRef } from 'react';

/**
 * Ensures loading state is shown for a minimum duration.
 * Prevents skeleton flicker when data loads too fast.
 * @param {boolean} isLoading - actual loading state
 * @param {number} minMs - minimum display time in ms (default 400)
 * @returns {boolean} showLoading - whether to show the skeleton
 */
export default function useMinLoadingTime(isLoading, minMs = 400) {
  const [showLoading, setShowLoading] = useState(true);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      startRef.current = Date.now();
      setShowLoading(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      const elapsed = startRef.current ? Date.now() - startRef.current : 0;
      const remaining = Math.max(0, minMs - elapsed);
      if (remaining === 0) {
        setShowLoading(false);
      } else {
        timerRef.current = setTimeout(() => {
          setShowLoading(false);
          timerRef.current = null;
        }, remaining);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, minMs]);

  return showLoading;
}
