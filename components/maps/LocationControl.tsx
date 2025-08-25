"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

interface LocationControlProps {
  userLocation: [number, number] | null;
  onLocationRequest?: () => void;
}

export default function LocationControl({ userLocation, onLocationRequest }: LocationControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create custom control
    const LocationControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
        // Style the container
        container.style.backgroundColor = 'white';
        container.style.width = '40px';
        container.style.height = '40px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.65)';
        container.style.border = '2px solid rgba(0,0,0,0.2)';
        
        // Add icon
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        `;
        icon.style.color = userLocation ? '#3B82F6' : '#6B7280';
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        
        container.appendChild(icon);
        
        // Add hover effects
        container.onmouseenter = function() {
          container.style.backgroundColor = '#f9fafb';
        };
        container.onmouseleave = function() {
          container.style.backgroundColor = 'white';
        };
        
        // Add click handler
        container.onclick = function(e) {
          L.DomEvent.stopPropagation(e);
          if (userLocation) {
            // Return to user location
            map.setView(userLocation, 12);
          } else if (onLocationRequest) {
            // Request location access
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
  }, [map, userLocation, onLocationRequest]);

  return null;
}
