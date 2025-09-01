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
    console.log("🚀 useVenuePins useEffect RUNNING!");
    
    const fetchPins = async () => {
      try {
        console.log("📡 Starting fetchPins...");
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/venues/pins");
        console.log("📡 Response received:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch pins: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📡 Data parsed:", { count: data.pins?.length });

        if (data.error) {
          throw new Error(data.error);
        }

        const pins = data.pins || [];
        console.log("📍 About to set pins state:", { count: pins.length, firstPin: pins[0] });
        setPins(pins);
        console.log("📍 pins state should now be updated");
      } catch (err) {
        console.error("❌ Error in fetchPins:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch venue pins");
      } finally {
        console.log("📍 Setting loading to false");
        setLoading(false);
      }
    };

    fetchPins();
  }, []); // Empty dependency array

  const refetch = useCallback(async () => {
    console.log("🔄 Manual refetch called");
    // The refetch logic would go here if needed
  }, []);

  return {
    pins,
    loading,
    error,
    refetch,
  };
}
