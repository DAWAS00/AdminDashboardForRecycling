import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Rider, ActiveRoute } from "../types";
import { AMMAN_CENTER, STATUS_CONFIG } from "../constants";
import { makeRiderIcon } from "../helpers";
import { RouteLayer } from "./RouteLayer";
import { FleetRadarLayer } from "./FleetRadarLayer";
import { StaticRouteLineLayer } from "./StaticRouteLineLayer";

interface LiveMapLayerProps {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  activeRoute: ActiveRoute | null;
  onAnimationStep: (coordIndex: number) => void;
  onAnimationComplete: () => void;
  fleetRadar?: boolean;
}

export function LiveMapLayer({
  riders, selectedId, onSelect,
  activeRoute, onAnimationStep, onAnimationComplete,
  fleetRadar = false
}: LiveMapLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const markersRef   = useRef<Record<number, L.Marker>>({});
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: AMMAN_CENTER,
      zoom: 13,
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

    riders.forEach(rider => {
      const m = L.marker([rider.lat, rider.lng], { icon: makeRiderIcon(rider, false) });
      m.on("click", () => onSelectRef.current(rider.id));
      m.bindTooltip(
        `<b>${rider.name}</b> · ${rider.vehicle}<br><span style="color:${STATUS_CONFIG[rider.status].color}">${STATUS_CONFIG[rider.status].label}</span>`,
        { direction: "top", offset: [0, -24], className: "rider-tip" }
      );
      m.addTo(map);
      markersRef.current[rider.id] = m;
    });

    mapRef.current = map;
    setMapInstance(map);
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapInstance(null);
      markersRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    riders.forEach(rider => {
      const m = markersRef.current[rider.id];
      if (!m) return;
      m.addTo(mapInstance);
      m.setIcon(makeRiderIcon(rider, selectedId === rider.id));
      m.setZIndexOffset(selectedId === rider.id ? 1000 : 0);
    });
  }, [selectedId, riders, mapInstance]);

  // When admin selects a rider, the map smoothly flies to that rider's position
  useEffect(() => {
    if (!mapInstance || selectedId === null) return;
    const rider = riders.find(r => r.id === selectedId);
    if (!rider) return;
    // 100ms delay prevents firing on initial mount
    const t = setTimeout(() => {
      mapInstance.flyTo([rider.lat, rider.lng], 15, { duration: 0.8 });
    }, 100);
    return () => clearTimeout(t);
    // Intentionally omit `riders` from deps — positions don't change during session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mapInstance]);

  const selectedRider = selectedId !== null ? riders.find(r => r.id === selectedId) ?? null : null;

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {mapInstance && (
        <>
          <RouteLayer
            map={mapInstance}
            route={activeRoute?.route ?? null}
            rider={riders.find(r => r.id === activeRoute?.riderId) ?? null}
            riderLat={riders.find(r => r.id === activeRoute?.riderId)?.lat ?? 31.963}
            riderLng={riders.find(r => r.id === activeRoute?.riderId)?.lng ?? 35.905}
            onAnimationStep={onAnimationStep}
            onAnimationComplete={onAnimationComplete}
            coordsPerTick={2}
            tickMs={250}
          />
          {fleetRadar && (
            <FleetRadarLayer
              map={mapInstance}
              riders={riders}
              activeRouteRiderId={activeRoute?.riderId ?? null}
            />
          )}
          <StaticRouteLineLayer
            map={mapInstance}
            selectedRider={selectedRider}
          />
        </>
      )}
    </div>
  );
}
