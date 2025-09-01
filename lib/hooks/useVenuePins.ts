import { useState, useEffect, useCallback } from "react";

interface VenuePin {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface UseVenuePinsResult {
  pins: VenuePin[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVenuePins(): UseVenuePinsResult {
  const [pins, setPins] = useState<VenuePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
        const fetchPins = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/venues/pins");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pins: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        const pins = data.pins || [];
        setPins(pins);
      } catch (err) {
        console.error("❌ Error in fetchPins:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch venue pins"
        );
      } finally {

        setLoading(false);
      }
    };

    fetchPins();
  }, []); // Empty dependency array

  const refetch = useCallback(async () => {
    // The refetch logic would go here if needed
  }, []);

  return {
    pins,
    loading,
    error,
    refetch,
  };
}
