"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Dynamically import InteractiveMap with no SSR
const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => {
    // Get the same height configuration as the actual map
    const mapHeightVh = Number(process.env.NEXT_PUBLIC_MAP_HEIGHT_VH) || 42.86;

    return (
      <div
        className="w-full h-full !rounded-none md:!rounded-xl overflow-hidden relative border-0 md:border flex items-center justify-center bg-gray-100"
        style={{ height: "100%" }}
      >
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-3 animate-pulse" />
          <div className="text-sm">Loading interactive map...</div>
        </div>
      </div>
    );
  },
});

export default function InteractiveMapWrapper(props: any) {
  return <InteractiveMap {...props} />;
}
