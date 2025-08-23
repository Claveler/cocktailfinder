"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Dynamically import LocationMap with no SSR
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <Card className="w-full overflow-hidden" style={{ height: "384px" }}>
      <CardContent className="p-0 h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-3 animate-pulse" />
          <div className="text-sm">Loading map...</div>
        </div>
      </CardContent>
    </Card>
  ),
});

export default LocationMap;
