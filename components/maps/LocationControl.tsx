"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { getThemeColorAsHex, getThemeColorAsHexDarker } from "@/lib/utils";

interface LocationControlProps {
  userLocation: [number, number] | null;
  onLocationRequest?: () => void;
  zoom?: number;
}

export default function LocationControl({ userLocation, onLocationRequest, zoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13 }: LocationControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Get theme colors
    const primaryColor = getThemeColorAsHex('primary', '#DC2626');
    const primaryHoverColor = getThemeColorAsHexDarker('primary', 15, '#B91C1C');
    
    // Create custom control
    const LocationControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
        // Style the container with primary theme color
        container.style.backgroundColor = primaryColor;
        container.style.width = '40px';
        container.style.height = '40px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.65)';
        container.style.border = '2px solid rgba(0,0,0,0.1)';
        container.style.transition = 'all 0.2s ease';
        
        // Add Google Material Icons "my_location" icon
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z"/>
          </svg>
        `;
        icon.style.color = 'white';  // White icon on primary background
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        
        container.appendChild(icon);
        
        // Add hover effects
        container.onmouseenter = function() {
          container.style.backgroundColor = primaryHoverColor;  // Darker primary on hover
          container.style.transform = 'scale(1.05)';
        };
        container.onmouseleave = function() {
          container.style.backgroundColor = primaryColor;  // Back to primary
          container.style.transform = 'scale(1)';
        };
        
        // Add click handler
        container.onclick = function(e) {
          L.DomEvent.stopPropagation(e);
          if (userLocation) {
            // Return to user location with smooth animation
            const flyToDuration = Number(process.env.NEXT_PUBLIC_FLYTO_DURATION) || 1.5;
            console.log('🎯 Crosshair: Flying to user location', userLocation, 'zoom:', zoom, 'duration:', flyToDuration);
            map.flyTo(userLocation, zoom, {
              animate: true,
              duration: flyToDuration
            });
          } else if (onLocationRequest) {
            // Request location access
            console.log('🎯 Crosshair: Requesting location access');
            onLocationRequest();
          }
        };
        
        // Add title tooltip
        container.title = userLocation 
          ? 'Return to your location' 
          : 'Get your location';
        
        return container;
      }
    });

    // Add control to map
    const locationControl = new LocationControl({ position: 'topright' });
    map.addControl(locationControl);

    // Cleanup
    return () => {
      map.removeControl(locationControl);
    };
  }, [map, userLocation, onLocationRequest, zoom]);

  return null;
}
