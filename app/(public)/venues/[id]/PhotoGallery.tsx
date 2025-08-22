"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoGalleryProps {
  photos: string[];
  venueName: string;
}

export default function PhotoGallery({ photos, venueName }: PhotoGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      container.addEventListener('scroll', checkScrollability);
      return () => container.removeEventListener('scroll', checkScrollability);
    }
  }, []);

  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const photoWidth = 320 + 16; // photo width + gap
    container.scrollBy({ left: photoWidth, behavior: 'smooth' });
  };

  const scrollToPrev = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const photoWidth = 320 + 16; // photo width + gap
    container.scrollBy({ left: -photoWidth, behavior: 'smooth' });
  };

  if (photos.length === 0) {
    return (
      <div>
        <h4 className="font-semibold mb-2">Photos</h4>
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
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
        <h4 className="font-semibold mb-2">Photo</h4>
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
        <p className="text-xs text-muted-foreground mt-2">
          Click to view full size
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold mb-2">Photos ({photos.length})</h4>
      <div className="relative">
        {/* Photo Gallery Container with Arrows */}
        <div className="relative group">
          {/* Left Arrow - positioned at center of photo area (excluding padding) */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 z-10 bg-white/90 hover:bg-white shadow-lg"
              style={{ 
                top: 'calc(50% - 8px)', // 50% of container minus half of bottom padding (pb-4 = 16px)
                transform: 'translateY(-50%)'
              }}
              onClick={scrollToPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Arrow - positioned at center of photo area (excluding padding) */}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 z-10 bg-white/90 hover:bg-white shadow-lg"
              style={{ 
                top: 'calc(50% - 8px)', // 50% of container minus half of bottom padding (pb-4 = 16px)
                transform: 'translateY(-50%)'
              }}
              onClick={scrollToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Photo Gallery */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          >
          {photos.map((photo, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-80 aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group relative"
            >
              <a
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={photo}
                  alt={`${venueName} - Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
              {/* Photo counter */}
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}/{photos.length}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">
            Use arrows or scroll horizontally to see all photos
          </p>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span>→</span>
            <span>Swipe on mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
