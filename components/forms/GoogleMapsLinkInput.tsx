"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Link, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  parseGoogleMapsUrl,
  isGoogleMapsUrl,
  formatCoordinates,
} from "@/lib/maps";
import type { Coordinates, VenueInfo } from "@/lib/maps";

interface GoogleMapsLinkInputProps {
  onCoordinatesExtracted: (
    coordinates: Coordinates,
    originalUrl?: string,
    venueInfo?: VenueInfo
  ) => void;
  currentCoordinates?: Coordinates;
  disabled?: boolean;
}

export default function GoogleMapsLinkInput({
  onCoordinatesExtracted,
  currentCoordinates,
  disabled = false,
}: GoogleMapsLinkInputProps) {
  const [mapsUrl, setMapsUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleUrlSubmit = async () => {
    if (!mapsUrl.trim()) {
      setStatus({
        type: "error",
        message: "Please enter a Google Maps URL",
      });
      return;
    }

    if (!isGoogleMapsUrl(mapsUrl)) {
      setStatus({
        type: "error",
        message: "Please enter a valid Google Maps URL",
      });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle" });

    // Show different processing messages based on URL type
    const isShortUrl =
      mapsUrl.includes("maps.app.goo.gl") || mapsUrl.includes("goo.gl");

    try {
      const result = await parseGoogleMapsUrl(mapsUrl);

      if (result.success && result.coordinates) {
        onCoordinatesExtracted(result.coordinates, mapsUrl, result.venueInfo);

        // Build success message with venue info if available
        let message = `${isShortUrl ? "Short URL expanded and coordinates extracted" : "Coordinates extracted"}: ${formatCoordinates(result.coordinates)}`;

        if (result.venueInfo?.name) {
          message += `\nVenue: ${result.venueInfo.name}`;
        }
        if (result.venueInfo?.address) {
          message += `\nAddress: ${result.venueInfo.address}`;
        }
        if (result.venueInfo?.city) {
          message += `\nCity: ${result.venueInfo.city}`;
        }

        setStatus({
          type: "success",
          message,
        });
        setMapsUrl(""); // Clear the input after successful extraction
      } else {
        setStatus({
          type: "error",
          message:
            result.error || "Could not extract coordinates from this URL",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Failed to process the URL. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="maps-url" className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          Google Maps Link
          <Badge variant="secondary" className="text-xs">
            Recommended
          </Badge>
        </Label>
        <div className="flex gap-2">
          <Input
            id="maps-url"
            type="url"
            placeholder="Paste Google Maps link here (e.g., https://maps.app.goo.gl/...)"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isProcessing}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={disabled || isProcessing || !mapsUrl.trim()}
            size="default"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mapsUrl.includes("maps.app.goo.gl") ||
                mapsUrl.includes("goo.gl")
                  ? "Expanding..."
                  : "Processing..."}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Extract
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          💡 Find your venue on Google Maps, then either share the link or copy
          the URL from your browser. We'll automatically extract coordinates and
          venue details!
        </p>
      </div>

      {/* Status Messages */}
      {status.type === "success" && status.message && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      {status.type === "error" && status.message && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {status.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Coordinates Display */}
      {currentCoordinates && (
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Current coordinates:</span>
            <code className="font-mono text-primary">
              {formatCoordinates(currentCoordinates)}
            </code>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>✅ All Google Maps formats supported:</strong>
        </p>
        <ul className="ml-4 space-y-1">
          <li>
            • Share links: <code>https://maps.app.goo.gl/...</code>
          </li>
          <li>
            • Place URLs: <code>https://www.google.com/maps/place/...</code>
          </li>
          <li>
            • Search URLs: <code>https://www.google.com/maps/search/...</code>
          </li>
          <li>
            • Direct coordinates:{" "}
            <code>https://www.google.com/maps?q=lat,lng</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
