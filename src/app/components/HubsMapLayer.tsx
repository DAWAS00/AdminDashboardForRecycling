import { useEffect, useRef } from "react";
import L from "leaflet";
import { Hub } from "../types";
import { AMMAN_CENTER, HUB_STATUS_CONFIG } from "../constants";
import { makeHubIcon } from "../helpers";

interface HubsMapLayerProps {
  hubs: Hub[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  placing: boolean;
  onPlace: (lat: number, lng: number) => void;
}

export function HubsMapLayer({ hubs, selectedId, onSelect, placing, onPlace }: HubsMapLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Record<number, L.Marker>>({});
  const onSelectRef  = useRef(onSelect);
  const onPlaceRef   = useRef(onPlace);
  const placingRef   = useRef(placing);
  
  onSelectRef.current = onSelect;
  onPlaceRef.current  = onPlace;
  placingRef.current  = placing;

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

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (placingRef.current) {
        onPlaceRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  // Sync hub markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    
    // Add current hubs
    hubs.forEach(hub => {
      const m = L.marker([hub.lat, hub.lng], { icon: makeHubIcon(hub, selectedId === hub.id) });
      m.on("click", (e: L.LeafletMouseEvent) => {
        e.originalEvent.stopPropagation();
        onSelectRef.current(hub.id);
      });
      
      m.bindTooltip(
        `<b>${hub.name}</b><br>${hub.address}<br><span style="color:${HUB_STATUS_CONFIG[hub.status].color}">${HUB_STATUS_CONFIG[hub.status].label}</span>`,
        { direction: "top", offset: [0, -24], className: "rider-tip" }
      );
      
      m.addTo(map);
      markersRef.current[hub.id] = m;
    });
  }, [hubs, selectedId]);

  // Cursor style
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.cursor = placing ? "crosshair" : "";
  }, [placing]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
