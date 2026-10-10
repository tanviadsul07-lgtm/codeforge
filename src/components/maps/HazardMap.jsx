import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Reliable Multi-Provider Tile Configuration Matrix (No Commercial Keys Required)
const TILE_PROVIDERS = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap Standard (Official)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | PathRakshak AI'
    }
  },
  {
    id: 'esri-street',
    name: 'Esri World Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan'
    }
  },
  {
    id: 'esri-topo',
    name: 'Esri Topographic Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN'
    }
  },
  {
    id: 'esri-imagery',
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
    }
  }
];

export const HazardMap = ({
  hazards = [],
  selectedHazardId = null,
  onSelectHazard,
  onMapClick,
  center = [28.6139, 77.2090], // Default New Delhi center
  zoom = 12,
  height = '500px'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});

  const [providerIndex, setProviderIndex] = useState(0);
  const [isOfflineError, setIsOfflineError] = useState(false);

  const activeProvider = TILE_PROVIDERS[providerIndex] || TILE_PROVIDERS[0];

  // Helper to safely switch tile layers
  const setTileProvider = (index) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const provider = TILE_PROVIDERS[index] || TILE_PROVIDERS[0];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let errorsForThisLayer = 0;
    const newLayer = L.tileLayer(provider.url, provider.options);

    newLayer.on('tileerror', () => {
      errorsForThisLayer++;
      console.warn(`[Leaflet Tile Warning] Provider: "${provider.name}" failed to load tile (${errorsForThisLayer} errors).`);

      // If errors exceed threshold, auto failover to next provider
      if (errorsForThisLayer >= 5 && index < TILE_PROVIDERS.length - 1) {
        console.warn(`[Leaflet Auto Failover] Switching from "${provider.name}" to next tile provider...`);
        setProviderIndex(prev => prev + 1);
      } else if (errorsForThisLayer >= 10 && index >= TILE_PROVIDERS.length - 1) {
        setIsOfflineError(true);
      }
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
    setProviderIndex(index);
    setIsOfflineError(false);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const validCenterLat = typeof center[0] === 'number' && !isNaN(center[0]) ? center[0] : 28.6139;
      const validCenterLng = typeof center[1] === 'number' && !isNaN(center[1]) ? center[1] : 77.2090;

      const map = L.map(mapRef.current, {
        center: [validCenterLat, validCenterLng],
        zoom,
        zoomControl: true
      });

      // Initial Tile Layer setup
      const initialLayer = L.tileLayer(activeProvider.url, activeProvider.options);

      let initialErrors = 0;
      initialLayer.on('tileerror', () => {
        initialErrors++;
        if (initialErrors >= 5) {
          console.warn('[Leaflet Initial Tile Error] Auto failover triggered');
          setProviderIndex(1);
        }
      });

      initialLayer.addTo(map);
      tileLayerRef.current = initialLayer;

      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add hazard markers with status-based colors
    (hazards || []).forEach(hazard => {
      if (!hazard) return;
      const lat = typeof hazard.latitude === 'number' ? hazard.latitude : parseFloat(hazard.latitude);
      const lng = typeof hazard.longitude === 'number' ? hazard.longitude : parseFloat(hazard.longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const hazardId = hazard.id || hazard.hazardId || hazard.reportId;
      const isSelected = hazardId === selectedHazardId;

      // Map Status Colors per Brand Specification
      const getMarkerColor = (h) => {
        const stat = (h.status || h.verificationStatus || '').toString().toLowerCase();
        if (stat === 'resolved' || stat === 'completed' || stat === 'approved') return '#38D996'; // Resolved = Green (#38D996)
        const sev = (h.severity || h.priority || '').toString();
        if (sev === 'Critical' || sev === 'High') return '#FF647C'; // Active Critical/High = Red (#FF647C)
        return '#F5B942'; // Medium/Pending = Yellow (#F5B942)
      };

      const color = isSelected ? '#12BDF2' : getMarkerColor(hazard);
      const isResolved = (hazard.status || '').toLowerCase() === 'resolved';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${color};
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            border-radius: 50%;
            border: 3px solid ${isSelected ? '#45E4F4' : '#071522'};
            box-shadow: ${isSelected ? '0 0 16px rgba(18, 189, 242, 0.8)' : '0 2px 8px rgba(0,0,0,0.5)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            <div style="width: 6px; height: 6px; background-color: #FFF; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: var(--font-family, sans-serif); min-width: 220px; color: #F2F8FC; padding: 4px;">
          <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 2px; color: #38BDF8;">${hazard.category || hazard.reportType || 'Road Hazard'}</div>
          <div style="font-size: 0.78rem; color: #91A9BB; margin-bottom: 6px;">${hazard.address || hazard.location || 'Geolocated Point'}</div>
          
          <div style="font-size: 0.75rem; color: #38D996; font-weight: 700; margin-bottom: 4px;">
            Status: ${isResolved ? '✓ RESOLVED (Repair Approved)' : (hazard.status || 'Active Hazard')}
          </div>

          ${hazard.dimensions ? `<div style="font-size: 0.73rem; color: #F8FAFC; margin-bottom: 2px;"><strong>Dimensions:</strong> ${hazard.dimensions}</div>` : ''}
          ${hazard.estimatedCost ? `<div style="font-size: 0.73rem; color: #F5B942; margin-bottom: 6px;"><strong>Est Repair Cost:</strong> ${hazard.estimatedCost}</div>` : ''}

          <div style="font-size: 0.72rem; color: #94A3B8; margin-bottom: 6px;">
            GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; border-top: 1px solid #164A6B; padding-top: 6px;">
            <span style="font-weight: 700; color: ${color};">${hazard.severity || hazard.priority || 'Medium'}</span>
            <span style="font-size: 0.7rem; color: #647C90; font-weight: 600;">${hazardId}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectHazard) onSelectHazard(hazard);
      });

      markersRef.current[hazardId] = marker;
    });

    // Fit bounds if valid hazard points exist
    if (hazards.length > 0) {
      const validPoints = hazards
        .map(h => [typeof h.latitude === 'number' ? h.latitude : parseFloat(h.latitude), typeof h.longitude === 'number' ? h.longitude : parseFloat(h.longitude)])
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90);

      if (validPoints.length > 0 && !selectedHazardId) {
        try {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [30, 30] });
        } catch {}
      }
    }

    // Pan to selected hazard
    if (selectedHazardId && hazards.length > 0) {
      const selected = hazards.find(h => (h.id || h.hazardId || h.reportId) === selectedHazardId);
      if (selected) {
        const lat = typeof selected.latitude === 'number' ? selected.latitude : parseFloat(selected.latitude);
        const lng = typeof selected.longitude === 'number' ? selected.longitude : parseFloat(selected.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.panTo([lat, lng]);
          if (markersRef.current[selectedHazardId]) {
            markersRef.current[selectedHazardId].openPopup();
          }
        }
      }
    }
  }, [hazards, selectedHazardId, center, zoom]);

  // Handle tile layer switch when providerIndex state updates
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      const map = mapInstanceRef.current;
      map.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(activeProvider.url, activeProvider.options);
      newLayer.addTo(map);
      tileLayerRef.current = newLayer;
    }
  }, [providerIndex]);

  const displayLat = typeof center[0] === 'number' ? center[0].toFixed(5) : '28.61390';
  const displayLng = typeof center[1] === 'number' ? center[1].toFixed(5) : '77.20900';

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#0B1E36' }}>
      {/* Map Control Bar Overlay (Top Right) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(7, 23, 43, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        color: '#E2E8F0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        <span style={{ fontWeight: 600, color: '#38BDF8' }}>Basemap:</span>
        <select
          value={providerIndex}
          onChange={(e) => setTileProvider(parseInt(e.target.value, 10))}
          style={{
            backgroundColor: '#0F2942',
            color: '#F8FAFC',
            border: '1px solid #1E3A5F',
            borderRadius: '4px',
            fontSize: '0.75rem',
            padding: '2px 6px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {TILE_PROVIDERS.map((prov, idx) => (
            <option key={prov.id} value={idx}>{prov.name}</option>
          ))}
        </select>
      </div>

      {/* Offline / Tile Error Banner (Step 5 Error Handling) */}
      {isOfflineError && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#F8FAFC',
          fontSize: '0.8rem',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#F87171', marginBottom: '2px' }}>Map Tile Server Unavailable</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Preserved Geotag Coordinates: Lat {displayLat}, Lng {displayLng}
            </div>
          </div>
          <button
            onClick={() => setTileProvider((providerIndex + 1) % TILE_PROVIDERS.length)}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Retry / Switch Basemap
          </button>
        </div>
      )}

      {/* Map DOM Container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
