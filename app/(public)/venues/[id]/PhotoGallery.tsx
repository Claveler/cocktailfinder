"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoGalleryProps {
  photos: string[];
  venueName: string;
  showTitle?: boolean;
}

export default function PhotoGallery({
  photos,
  venueName,
  showTitle = true,
}: PhotoGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, scrollLeft: 0 });

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      return () => container.removeEventListener("scroll", checkScrollability);
    }
  }, []);

  // Global mouse up event for drag functionality
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Only handle if this mouseup is related to our gallery
      const target = e.target as HTMLElement;
      const isGalleryRelated = target.closest("[data-photo-gallery]");

      // Always stop dragging for safety, but don't interfere with other components
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerHeight = container.clientHeight;
    const photoWidth = (containerHeight * 4) / 3 + 16; // aspect-[4/3] width based on height + gap
    container.scrollBy({ left: photoWidth, behavior: "smooth" });
  };

  const scrollToPrev = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerHeight = container.clientHeight;
    const photoWidth = (containerHeight * 4) / 3 + 16; // aspect-[4/3] width based on height + gap
    container.scrollBy({ left: -photoWidth, behavior: "smooth" });
  };

  // Mouse drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    setDragStart({
      x: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStart.x) * 2; // Multiply by 2 for faster scrolling
    container.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      scrollLeft: container.scrollLeft,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const x = touch.clientX;
    const walk = (touchStart.x - x) * 2; // Multiply by 2 for faster scrolling
    container.scrollLeft = touchStart.scrollLeft + walk;
  };

  if (photos.length === 0) {
    return (
      <div>
        {showTitle && <h4 className="font-semibold mb-2">Photos</h4>}
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">No photos available</div>
            <div className="text-xs text-muted-foreground mt-1">
              Be the first to share photos of this venue!
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div>
        {showTitle && <h4 className="font-semibold mb-2">Photo</h4>}
        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden max-w-md">
          <a
            href={photos[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={photos[0]}
              alt={venueName}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </a>
        </div>
        {showTitle && (
          <p className="text-xs text-muted-foreground mt-2">
            Click to view full size
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full" data-photo-gallery>
      {showTitle && (
        <h4 className="font-semibold mb-2">Photos ({photos.length})</h4>
      )}
      <div className="relative w-full h-full">
        {/* Photo Gallery Container with Arrows */}
        <div className="relative group h-full">
          {/* Left Arrow - hidden on mobile, visible on desktop */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 z-50 bg-white/90 hover:bg-white shadow-lg hidden md:flex"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onClick={scrollToPrev}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Arrow - hidden on mobile, visible on desktop */}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 z-50 bg-white/90 hover:bg-white shadow-lg hidden md:flex"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onClick={scrollToNext}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Photo Gallery - Consistent 25px hint for all photos */}
          <div
            ref={scrollContainerRef}
            className="flex gap-1 md:gap-4 overflow-x-auto scrollbar-hide w-full h-full md:cursor-grab select-none snap-x snap-mandatory"
            style={{ 
              cursor: isDragging ? "grabbing" : "grab",
              // Always 25px padding to show hints
              paddingRight: photos.length > 1 ? "25px" : "0"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {photos.map((photo, index) => {
              const isLastPhoto = index === photos.length - 1;
              const isMultiplePhotos = photos.length > 1;
              
              return (
                <div
                  key={index}
                  className="flex-shrink-0 h-full bg-gray-100 md:rounded-lg overflow-hidden group relative snap-start"
                  style={{
                    // All photos same width - this creates the hint effect naturally
                    width: isMultiplePhotos 
                      ? "calc(100% - 25px - 0.25rem)" // All photos leave 25px space for hint
                      : "100%", // Single photos take full width
                    aspectRatio: "4/3",
                    // Last photo snaps to end to show previous photo hint on left
                    scrollSnapAlign: isLastPhoto ? "end" : "start"
                  }}
                >
                  <a
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <img
                      src={photo}
                      alt={`${venueName} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll hint */}
        {showTitle && (
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground">
              <span className="md:hidden">Swipe to see all photos</span>
              <span className="hidden md:inline">Use arrows or scroll horizontally to see all photos</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
