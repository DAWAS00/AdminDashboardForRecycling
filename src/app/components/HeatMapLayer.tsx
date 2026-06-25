import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { District, Hub, MaterialFilter, HeatMapViewMode } from "../types";
import { AMMAN_CENTER } from "../constants";
import { districtFillColor, districtFillColorForMaterial } from "../helpers";

interface HeatMapLayerProps {
  districts: District[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  viewMode: HeatMapViewMode;
  materialFilter: MaterialFilter;
  hubs: Hub[];
  showAmmanBoundary: boolean;
  showRiderHotspots: boolean;
  showDensityHeat: boolean;
  showHubCoverage: boolean;
}

interface Hotspot {
  name: string;
  lat: number;
  lng: number;
  reason: string;
  intensity: "high" | "critical";
}

const RIDER_HOTSPOTS: Hotspot[] = [
  { name: "Downtown Demand Zone", lat: 31.952, lng: 35.934, reason: "High volume: 14 active collections", intensity: "critical" },
  { name: "8th Circle Yield Area", lat: 31.959, lng: 35.853, reason: "70% Unrealized CO₂ potential (658 kg)", intensity: "critical" },
  { name: "Sweifieh Restaurant Hub", lat: 31.944, lng: 35.870, reason: "High density of organic/oil pickups", intensity: "high" },
];

const AMMAN_BOUNDARY: [number, number][] = [
  [32.030, 35.830],
  [32.030, 35.950],
  [31.980, 35.980],
  [31.890, 35.980],
  [31.890, 35.910],
  [31.930, 35.830],
  [32.030, 35.830], // close loop
];

function generateDistrictPoints(d: District): [number, number][] {
  const points: [number, number][] = [];
  const count = d.orderCount;
  
  const lats = d.polygon.map(p => p[0]);
  const lngs = d.polygon.map(p => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  
  let seed = 0;
  for (let i = 0; i < d.id.length; i++) {
    seed += d.id.charCodeAt(i);
  }

  const pseudorandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count * 2; i++) {
    const lat = minLat + (maxLat - minLat) * pseudorandom();
    const lng = minLng + (maxLng - minLng) * pseudorandom();
    points.push([lat, lng]);
  }
  return points;
}

function makeHotspotIcon(h: Hotspot): L.DivIcon {
  const color = h.intensity === "critical" ? "#ef4444" : "#f59e0b";
  return L.divIcon({
    html: `
      <div class="hotspot-pulse-container" style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
        <div class="pulse-ring" style="position:absolute; width:100%; height:100%; border-radius:50%; border:3px solid ${color}; opacity:0; animation: hotspotPulse 2s infinite ease-out;"></div>
        <div class="pulse-ring-inner" style="position:absolute; width:65%; height:65%; border-radius:50%; border:1.5px solid ${color}; opacity:0; animation: hotspotPulse 2s infinite ease-out 0.5s;"></div>
        <div style="width:12px; height:12px; border-radius:50%; background:${color}; border:2px solid white; box-shadow:0 0 10px rgba(0,0,0,0.3); z-index:2;"></div>
      </div>
    `,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function HeatMapLayer({
  districts,
  selectedId,
  onSelect,
  viewMode,
  materialFilter,
  hubs,
  showAmmanBoundary,
  showRiderHotspots,
  showDensityHeat,
  showHubCoverage,
}: HeatMapLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);

  const polygonsRef       = useRef<Record<string, L.Polygon>>({});
  const centroidLayersRef = useRef<L.Layer[]>([]);
  const boundaryLayersRef = useRef<L.Layer[]>([]);
  const hotspotLayersRef  = useRef<L.Layer[]>([]);
  const densityLayersRef  = useRef<L.Layer[]>([]);
  const coverageLayersRef = useRef<L.Layer[]>([]);

  const [mapInitialized, setMapInitialized] = useState(false);
  const onSelectRef   = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: AMMAN_CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19
    }).addTo(map);
    
    L.control.attribution({
      prefix: "© OpenStreetMap © CARTO",
      position: "bottomright"
    }).addTo(map);

    mapRef.current = map;
    setMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapInitialized(false);
    };
  }, []);

  // Districts Choropleth + Glowing Centroids
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    // Clear old districts
    Object.values(polygonsRef.current).forEach(p => p.remove());
    polygonsRef.current = {};
    centroidLayersRef.current.forEach(l => l.remove());
    centroidLayersRef.current = [];

    districts.forEach(d => {
      const fillColor = districtFillColorForMaterial(d, materialFilter);
      const isSelected = d.id === selectedId;

      // Thin dashed outline vector boundary
      const poly = L.polygon(d.polygon as L.LatLngExpression[], {
        color: isSelected ? "#1a1a1a" : fillColor,
        fillColor: "transparent",
        weight: isSelected ? 3.5 : 1.5,
        opacity: isSelected ? 1 : 0.6,
        dashArray: isSelected ? undefined : "3, 5",
      });

      poly.bindTooltip(
        `<b>${d.name}</b><br>Potential: ${d.co2Potential} kg CO₂/wk<br>Achieved: ${d.co2Achieved} kg<br>Orders: ${d.orderCount}`,
        { direction: "top", className: "rider-tip", sticky: true }
      );
      poly.on("click", () => onSelectRef.current(d.id));
      poly.addTo(map);
      polygonsRef.current[d.id] = poly;

      // Layered circles create organic blurry centroids (thermal heat effect)
      const centroidGlow1 = L.circle(d.centroid as L.LatLngExpression, {
        radius: Math.max(150, Math.round(d.co2Potential * 0.8)),
        color: "transparent",
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.35 : 0.18,
      }).addTo(map);

      const centroidGlow2 = L.circle(d.centroid as L.LatLngExpression, {
        radius: Math.max(300, Math.round(d.co2Potential * 1.5)),
        color: "transparent",
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.18 : 0.08,
      }).addTo(map);

      const centerPulse = L.circleMarker(d.centroid as L.LatLngExpression, {
        radius: Math.max(6, Math.round(d.co2Potential / 150)),
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: 0.4,
        weight: 1,
      }).addTo(map);

      centroidLayersRef.current.push(centroidGlow1, centroidGlow2, centerPulse);
    });
  }, [mapInitialized, districts, selectedId, materialFilter]);

  // Amman Boundary Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    boundaryLayersRef.current.forEach(l => l.remove());
    boundaryLayersRef.current = [];

    if (showAmmanBoundary) {
      const outerLine = L.polyline(AMMAN_BOUNDARY, {
        color: "#06402B",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "12, 12",
      }).addTo(map);
      
      const innerLine = L.polyline(AMMAN_BOUNDARY, {
        color: "#C8860A",
        weight: 1.5,
        opacity: 0.7,
        dashArray: "6, 6",
      }).addTo(map);

      boundaryLayersRef.current = [outerLine, innerLine];
    }
  }, [mapInitialized, showAmmanBoundary]);

  // Heatmap Density Dots Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    densityLayersRef.current.forEach(l => l.remove());
    densityLayersRef.current = [];

    if (showDensityHeat) {
      districts.forEach(d => {
        const fillColor = districtFillColorForMaterial(d, materialFilter);
        const pts = generateDistrictPoints(d);
        
        pts.forEach(pt => {
          const core = L.circleMarker(pt, {
            radius: 3.5,
            color: fillColor,
            fillColor: "white",
            fillOpacity: 0.9,
            weight: 1,
            opacity: 0.8,
          }).addTo(map);

          const halo = L.circleMarker(pt, {
            radius: 12,
            color: "transparent",
            fillColor: fillColor,
            fillOpacity: 0.14,
          }).addTo(map);

          densityLayersRef.current.push(core, halo);
        });
      });
    }
  }, [mapInitialized, districts, showDensityHeat, materialFilter]);

  // Rider Hotspots Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    hotspotLayersRef.current.forEach(l => l.remove());
    hotspotLayersRef.current = [];

    if (showRiderHotspots) {
      RIDER_HOTSPOTS.forEach(h => {
        const marker = L.marker([h.lat, h.lng], { icon: makeHotspotIcon(h) });
        marker.bindTooltip(
          `<b>${h.name}</b><br><span style="color:#C8860A;font-weight:600;">Best Rider Spot</span><br>${h.reason}`,
          { direction: "top", offset: [0, -10], className: "rider-tip" }
        );
        marker.addTo(map);
        hotspotLayersRef.current.push(marker);
      });
    }
  }, [mapInitialized, showRiderHotspots]);

  // Hub Coverage Circles Effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    coverageLayersRef.current.forEach(l => l.remove());
    coverageLayersRef.current = [];

    if (!showHubCoverage) return;

    hubs.filter(h => h.active).forEach(h => {
      const circle = L.circle([h.lat, h.lng], {
        radius: 5000, // 5km in meters
        color: "#1E5C35",
        fillColor: "#1E5C35",
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.5,
        dashArray: "6, 4",
      });
      circle.bindTooltip(
        `<b>${h.name}</b><br>5km coverage area`,
        { direction: "top", className: "rider-tip" }
      );
      circle.addTo(map);
      coverageLayersRef.current.push(circle);
    });
  }, [mapInitialized, hubs, showHubCoverage]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <style>{`
        @keyframes hotspotPulse {
          0% { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </>
  );
}
