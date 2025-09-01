import { useState, useEffect } from "react";

/**
 * Hook to detect virtual keyboard state on mobile devices
 * Uses the modern visualViewport API when available
 */
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    // Use visualViewport API if available (modern browsers)
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport!;
        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;

        // Keyboard is likely open if viewport is significantly smaller than window
        const heightDiff = windowHeight - viewportHeight;
        const isOpen = heightDiff > 150; // 150px threshold to avoid false positives

        setIsKeyboardOpen(isOpen);
        setKeyboardHeight(isOpen ? heightDiff : 0);
      };

      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);

      // Initial check
      handleViewportChange();

      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          handleViewportChange
        );
      };
    } else {
      // Fallback for older browsers using window resize
      const initialHeight = window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        const isOpen = heightDiff > 150;

        setIsKeyboardOpen(isOpen);
        setKeyboardHeight(isOpen ? heightDiff : 0);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return {
    isKeyboardOpen,
    keyboardHeight,
  };
}
