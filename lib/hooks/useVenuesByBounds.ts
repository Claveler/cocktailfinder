import { useState, useEffect, useRef, useCallback } from "react";
import type { Venue } from "@/lib/venues";

interface VenueBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseVenuesByBoundsOptions {
  limit?: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface VenuesByBoundsResult {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  refetch: (bounds: VenueBounds) => void;
}

// Simple cache to avoid redundant API calls
const venueCache = new Map<string, { venues: Venue[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(bounds: VenueBounds, limit: number): string {
  // Round bounds to reduce cache misses for similar requests
  const roundedBounds = {
    north: Math.round(bounds.north * 1000) / 1000,
    south: Math.round(bounds.south * 1000) / 1000,
    east: Math.round(bounds.east * 1000) / 1000,
    west: Math.round(bounds.west * 1000) / 1000,
  };
  return `${roundedBounds.north},${roundedBounds.south},${roundedBounds.east},${roundedBounds.west},${limit}`;
}

function isValidCache(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export function useVenuesByBounds(
  initialBounds: VenueBounds | null = null,
  options: UseVenuesByBoundsOptions = {}
): VenuesByBoundsResult {
  const { limit = 50, debounceMs = 1000, enabled = true } = options;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVenues = useCallback(
    async (bounds: VenueBounds, signal?: AbortSignal) => {
      const cacheKey = getCacheKey(bounds, limit);

      // Check cache first
      const cached = venueCache.get(cacheKey);
      if (cached && isValidCache(cached.timestamp)) {
        setVenues(cached.venues);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          north: bounds.north.toString(),
          south: bounds.south.toString(),
          east: bounds.east.toString(),
          west: bounds.west.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/venues/by-bounds?${params}`, {
          signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch venues: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const fetchedVenues = data.venues || [];
        console.log("📊 Venues loaded:", {
          count: fetchedVenues.length,
          firstVenue: fetchedVenues[0]?.name,
          verifications: fetchedVenues[0]?.unique_verifiers,
          hasComments: fetchedVenues[0]?.recent_verifications?.length > 0,
        });

        // Cache the result
        venueCache.set(cacheKey, {
          venues: fetchedVenues,
          timestamp: Date.now(),
        });

        // Clean up old cache entries (keep only last 10)
        if (venueCache.size > 10) {
          const entries = Array.from(venueCache.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          venueCache.clear();
          entries.slice(0, 10).forEach(([key, value]) => {
            venueCache.set(key, value);
          });
        }

        setVenues(fetchedVenues);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }

        console.error("Error fetching venues by bounds:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch venues");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  const refetch = useCallback(
    (bounds: VenueBounds) => {
      console.log(
        "🔄 refetch called with bounds:",
        bounds,
        "enabled:",
        enabled
      );

      if (!enabled) {
        console.log("⚠️ refetch skipped - hook disabled");
        return;
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      console.log("⏰ Setting debounced fetch timeout:", debounceMs + "ms");
      // Debounce the API call
      debounceTimeoutRef.current = setTimeout(() => {
        console.log("🚀 Debounce timeout fired - calling fetchVenues");
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        fetchVenues(bounds, abortController.signal);
      }, debounceMs);
    },
    [enabled, debounceMs, fetchVenues]
  );

  // Initial fetch
  useEffect(() => {
    if (initialBounds && enabled) {
      refetch(initialBounds);
    }
  }, [initialBounds, enabled, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    venues,
    loading,
    error,
    refetch,
  };
}
