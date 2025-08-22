"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

// Venue type definition
export interface Venue {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "pending" | "approved" | "rejected";
}

interface MapProps {
  venues: Venue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// Dynamically import the actual map component to avoid SSR issues
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-full">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function Map({
  venues,
  height = "400px",
  center = [40.7128, -74.006], // Default to NYC
  zoom = 10,
}: MapProps) {
  // Filter to only show approved venues
  const approvedVenues = useMemo(
    () => venues.filter((venue) => venue.status === "approved"),
    [venues]
  );

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden">
      <DynamicMap venues={approvedVenues} center={center} zoom={zoom} />
    </div>
  );
}
