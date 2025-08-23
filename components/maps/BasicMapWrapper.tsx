"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Dynamically import BasicMap with no SSR
const BasicMap = dynamic(() => import("./BasicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-500">
        <MapPin className="w-8 h-8 mx-auto mb-3 animate-pulse" />
        <div className="text-sm">Loading map...</div>
      </div>
    </div>
  ),
});

export default BasicMap;
