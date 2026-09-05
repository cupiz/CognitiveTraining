"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LiveDataState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** Waktu fetch terakhir berhasil (epoch ms) */
  lastUpdated: number | null;
  refetch: () => void;
}

/**
 * Data otomatis segar: fetch ulang berkala + saat tab kembali fokus.
 * Cukup untuk "realtime" praktis tanpa server push (SSE/WebSocket).
 */
export function useLiveData<T>(
  fetcher: () => Promise<T>,
  intervalMs = 30_000,
): LiveDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(false);

  const load = useCallback(async (opts: { background?: boolean } = {}) => {
    if (opts.background) setRefreshing(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setLastUpdated(Date.now());
    } catch {
      if (!opts.background) {
        setError("Gagal memuat data. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Muat awal + polling
  useEffect(() => {
    void load();
    timerRef.current = setInterval(() => {
      // Jangan fetch saat tab tersembunyi; fetch ulang saat kembali fokus.
      if (!document.hidden) void load({ background: true });
    }, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !visibleRef.current) {
        visibleRef.current = true;
        void load({ background: true });
      } else if (document.visibilityState !== "visible") {
        visibleRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, intervalMs]);

  return { data, loading, refreshing, error, lastUpdated, refetch: () => void load({ background: true }) };
}
