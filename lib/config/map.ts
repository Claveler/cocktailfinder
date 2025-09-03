/**
 * Map configuration constants
 *
 * These values control zoom levels and map behavior across the app.
 * Centralized here for easy maintenance and consistency.
 */
export const MAP_CONFIG = {
  // Default zoom level for initial map view
  DEFAULT_ZOOM: 12,

  // Zoom level when searching for or focusing on a specific venue
  SEARCH_ZOOM: 12,

  // Zoom level at which marker clustering is disabled (markers become individual)
  CLUSTERING_DISABLE_ZOOM: 11,

  // Animation duration for map transitions (in seconds)
  FLY_TO_DURATION: 1.5,

  // Default center point (London Business School coordinates)
  DEFAULT_CENTER: [51.5261617, -0.1633234] as [number, number],

  // Additional zoom levels for specific use cases
  USER_LOCATION_ZOOM: 12,
  VENUE_DETAIL_ZOOM: 12,
} as const;

// Type helper for type safety
export type MapConfig = typeof MAP_CONFIG;
