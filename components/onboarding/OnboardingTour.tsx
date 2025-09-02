"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, Step } from "react-joyride";

interface OnboardingTourProps {
  startTour?: boolean;
  onTourEnd?: () => void;
}

const TOUR_STORAGE_KEY = "piscola-onboarding-completed";

export default function OnboardingTour({
  startTour = false,
  onTourEnd,
}: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check if user has completed onboarding before
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!hasCompletedTour && startTour) {
        // Small delay to ensure page elements are loaded
        const timer = setTimeout(() => {
          // Set location to LBS to ensure venues are visible for the tour
          if (
            typeof window !== "undefined" &&
            (window as any).setOnboardingLocation
          ) {
            (window as any).setOnboardingLocation();
          }

          // Start the tour after setting location
          setTimeout(() => {
            setRunTour(true);
          }, 500);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [startTour, isClient]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-3">
            Welcome to Piscola.net!
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Discover the best piscola spots worldwide. Let us show you how to
            explore our interactive map and find your pisco!
          </p>
        </div>
      ),
      placement: "center",
    },
    {
      target: "[data-tour='map-container']",
      content: (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Interactive Map
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Click and drag to explore different areas. Tap the pins to see venue
            details in the cards below, or use pinch gestures to zoom in and out
            on mobile.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: isMobile
        ? "[data-tour='first-venue-card'], [data-tour='first-venue-card-fallback']"
        : "[data-tour='venue-cards-area']",
      content: (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Venue Cards
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            As you move the map around, venues in your current view will appear
            {isMobile ? " like this. " : " here as cards. "}
            Scroll through them to see photos, reviews, and pisco verification
            status. Tap "See more" for full details and to add your comments!
          </p>
        </div>
      ),
      placement: isMobile ? "bottom" : "top",
      disableScrolling: isMobile, // Disable Joyride's scrolling on mobile for this step
    },
    {
      target: "[data-tour='search-button']",
      content: (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Search & Location
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Search for any city or neighborhood to jump there instantly. Or tap
            the location button to find piscola spots near you right now!
          </p>
        </div>
      ),
      placement: "top",
      disableScrolling: true, // Bottom nav bar is fixed, no scrolling needed
    },
    {
      target: "[data-tour='filter-button']",
      content: (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Smart Filters
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Filter venues by type (bars, restaurants), pisco brands, price
            range, or verification status to find exactly what you're looking
            for.
          </p>
        </div>
      ),
      placement: "top",
      disableScrolling: true, // Bottom nav bar is fixed, no scrolling needed
    },
    {
      target: "[data-tour='add-venue-button']",
      content: (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Share Your Discoveries
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Know a great piscola spot that's not on our map? Add it to help
            fellow piscola lovers discover new places! Building the community
            together.
          </p>
        </div>
      ),
      placement: "top",
      disableScrolling: true, // Bottom nav bar is fixed, no scrolling needed
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Joyride callback:", { status, type, index });
    }

    // Handle special scrolling for venue cards step on mobile
    if (type === "step:before" && index === 2 && isMobile) {
      // Prevent default and scroll to top immediately
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "instant", // Use instant instead of smooth for immediate positioning
        });
      }, 50); // Reduced delay
    }

    if (status === "finished" || status === "skipped") {
      // Mark tour as completed
      if (typeof window !== "undefined") {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      }
      setRunTour(false);

      // Restore user location when tour finishes
      if (
        status === "finished" &&
        typeof window !== "undefined" &&
        (window as any).restoreUserLocation
      ) {
        (window as any).restoreUserLocation();
      }

      onTourEnd?.();
    }
  };

  // Function to restart tour (can be called from help menu)
  const restartTour = () => {
    setRunTour(false); // Stop current tour first
    setTimeout(() => {
      // Set location to LBS to ensure venues are visible for the tour
      if (
        typeof window !== "undefined" &&
        (window as any).setOnboardingLocation
      ) {
        (window as any).setOnboardingLocation();
      }

      // Start the tour after setting location
      setTimeout(() => {
        setRunTour(true); // Restart from beginning
      }, 500);
    }, 100);
  };

  // Expose restart function globally for help menu
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      (window as any).restartOnboardingTour = restartTour;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).restartOnboardingTour;
      }
    };
  }, [isClient]);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--background))",
          textColor: "hsl(var(--foreground))",
          overlayColor: "rgba(0, 0, 0, 0.4)",
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
          zIndex: 100000, // Much higher z-index
        },
        tooltip: {
          borderRadius: 8,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          fontSize: isMobile ? 13 : 14,
          padding: isMobile ? 16 : 20,
          maxWidth: isMobile ? 280 : 320,
          margin: isMobile ? "0 16px" : "0",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 14,
          marginRight: 8,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 14,
        },
        buttonClose: {
          display: "none", // Hide close button, use skip instead
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        nextLabelWithProgress: "Next ({step}/{steps})",
        open: "Open the dialog",
        skip: "Skip tour",
      }}
      disableOverlayClose
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={20}
      spotlightClicks
      hideCloseButton
      floaterProps={{
        disableAnimation: false,
      }}
      debug={process.env.NODE_ENV === "development"}
    />
  );
}
