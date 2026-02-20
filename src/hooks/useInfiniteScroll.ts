import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
  /** Total number of items available */
  totalItems: number;
  /** Number of items per page/batch */
  pageSize?: number;
  /** Threshold in pixels before the sentinel triggers loading more */
  threshold?: number;
  /** Whether loading is currently in progress */
  isLoading?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  /** Items visible so far (slice of all data) */
  visibleData: T[];
  /** Ref to attach to the sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Reset visible count (e.g. when filters change) */
  reset: () => void;
  /** Current visible count */
  visibleCount: number;
}

export function useInfiniteScroll<T>(
  data: T[],
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn<T> {
  const { pageSize = 20, threshold = 200, isLoading = false } = options;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const prevDataLengthRef = useRef(data.length);

  // Reset when data changes significantly (filter/search changed)
  useEffect(() => {
    if (Math.abs(data.length - prevDataLengthRef.current) > pageSize / 2) {
      setVisibleCount(pageSize);
    }
    prevDataLengthRef.current = data.length;
  }, [data.length, pageSize]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    setVisibleCount((prev) => Math.min(prev + pageSize, data.length));
  }, [pageSize, data.length, isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, threshold]);

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  return {
    visibleData,
    sentinelRef,
    hasMore,
    reset,
    visibleCount,
  };
}