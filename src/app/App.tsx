import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  Leaf, Droplets, Package, Zap, MapPin, Wind,
  ChevronRight, X, Recycle, BarChart2, FileText,
  AlertCircle, Banknote, Layers, Warehouse, Plus,
  CheckSquare, Square, Truck, ChevronDown, ChevronUp,
  Calendar, ArrowUpRight,
} from "lucide-react";
import dawarLogo from "../imports/logo_2-removebg-preview__1_.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  material: keyof typeof MATERIAL_CONFIG;
  quantity: number;
  unit: string;
  address: string;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
}

interface Rider {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  lat: number;
  lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
}

interface HubMaterials {
  cookingOil: number;
  plastic: number;
  paper: number;
  electronics: number;
}

interface Hub {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active: boolean;
  capacityKg: number;
  currentLoad: HubMaterials;
  schedule: "weekly" | "monthly";
  nextShipmentDate: string;
  lastShipmentDate: string;
  status: "collecting" | "ready" | "shipped";
}

interface District {
  id: string;
  name: string;
  polygon: [number, number][];
  centroid: [number, number];
  co2Potential: number;
  co2Achieved: number;
  topMaterial: string;
  orderCount: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MATERIAL_CONFIG = {
  "Cooking Oil":       { color: "#C8860A", bg: "#FEF3C7", Icon: Droplets, unit: "L"  },
  "Plastic Bottles":   { color: "#1E40AF", bg: "#DBEAFE", Icon: Package,  unit: "kg" },
  "Paper & Cardboard": { color: "#166534", bg: "#DCFCE7", Icon: Package,  unit: "kg" },
  "Electronics":       { color: "#6D28D9", bg: "#EDE9FE", Icon: Zap,      unit: "kg" },
} as const;

const STATUS_CONFIG = {
  delivering: { label: "In Transit", color: "#1E5C35", bg: "#D1FAE5", dot: "#1E5C35" },
  picking_up: { label: "Picking Up", color: "#C8860A", bg: "#FEF3C7", dot: "#C8860A" },
  idle:       { label: "Idle",       color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

const ORDER_STATUS = {
  pending:   { label: "Pending",    color: "#C8860A", bg: "#FEF3C7" },
  accepted:  { label: "Accepted",   color: "#1E5C35", bg: "#D1FAE5" },
  inTransit: { label: "In Transit", color: "#1E40AF", bg: "#DBEAFE" },
  completed: { label: "Completed",  color: "#166534", bg: "#DCFCE7" },
};

const HUB_STATUS_CONFIG = {
  collecting: { label: "Collecting",    color: "#1E5C35", bg: "#D1FAE5" },
  ready:      { label: "Ready to Ship", color: "#C8860A", bg: "#FEF3C7" },
  shipped:    { label: "Shipped",       color: "#1E40AF", bg: "#DBEAFE" },
};

// ─── District data ────────────────────────────────────────────────────────────

const DISTRICTS: District[] = [
  {
    id: "downtown", name: "Downtown (Al-Balad)",
    polygon: [[31.943,35.924],[31.943,35.946],[31.960,35.946],[31.960,35.924]],
    centroid: [31.952, 35.934], co2Potential: 1240, co2Achieved: 1018,
    topMaterial: "Cooking Oil", orderCount: 14,
  },
  {
    id: "shmeisani", name: "Shmeisani",
    polygon: [[31.970,35.870],[31.970,35.895],[31.988,35.895],[31.988,35.870]],
    centroid: [31.979, 35.882], co2Potential: 890, co2Achieved: 534,
    topMaterial: "Plastic Bottles", orderCount: 8,
  },
  {
    id: "sweifieh", name: "Sweifieh",
    polygon: [[31.935,35.858],[31.935,35.882],[31.952,35.882],[31.952,35.858]],
    centroid: [31.944, 35.870], co2Potential: 1050, co2Achieved: 630,
    topMaterial: "Cooking Oil", orderCount: 11,
  },
  {
    id: "abdoun", name: "Abdoun",
    polygon: [[31.930,35.872],[31.930,35.900],[31.947,35.900],[31.947,35.872]],
    centroid: [31.940, 35.885], co2Potential: 760, co2Achieved: 608,
    topMaterial: "Cooking Oil", orderCount: 9,
  },
  {
    id: "jubaiha", name: "Jubaiha",
    polygon: [[31.992,35.858],[31.992,35.882],[32.012,35.882],[32.012,35.858]],
    centroid: [32.001, 35.869], co2Potential: 580, co2Achieved: 116,
    topMaterial: "Electronics", orderCount: 4,
  },
  {
    id: "tabarbour", name: "Tabarbour",
    polygon: [[32.005,35.908],[32.005,35.938],[32.025,35.938],[32.025,35.908]],
    centroid: [32.015, 35.922], co2Potential: 670, co2Achieved: 469,
    topMaterial: "Plastic Bottles", orderCount: 6,
  },
  {
    id: "eighth_circle", name: "8th Circle Area",
    polygon: [[31.950,35.842],[31.950,35.865],[31.968,35.865],[31.968,35.842]],
    centroid: [31.959, 35.853], co2Potential: 940, co2Achieved: 282,
    topMaterial: "Paper & Cardboard", orderCount: 7,
  },
  {
    id: "university", name: "University District",
    polygon: [[31.998,35.866],[31.998,35.892],[32.018,35.892],[32.018,35.866]],
    centroid: [32.008, 35.879], co2Potential: 440, co2Achieved: 396,
    topMaterial: "Electronics", orderCount: 3,
  },
  {
    id: "tlaa_ali", name: "Tlaa Al-Ali",
    polygon: [[31.940,35.845],[31.940,35.870],[31.958,35.870],[31.958,35.845]],
    centroid: [31.950, 35.857], co2Potential: 520, co2Achieved: 260,
    topMaterial: "Plastic Bottles", orderCount: 5,
  },
  {
    id: "airport_road", name: "Airport Road Corridor",
    polygon: [[31.895,35.930],[31.895,35.965],[31.925,35.965],[31.925,35.930]],
    centroid: [31.912, 35.947], co2Potential: 380, co2Achieved: 76,
    topMaterial: "Cooking Oil", orderCount: 3,
  },
];

function districtFillColor(d: District): string {
  const gap = d.co2Potential - d.co2Achieved;
  const gapPct = gap / d.co2Potential;
  if (gapPct >= 0.7) return "#ef4444"; // high unrealized — red
  if (gapPct >= 0.5) return "#f59e0b"; // amber
  if (gapPct >= 0.3) return "#84cc16"; // light green
  if (gapPct >= 0.1) return "#22c55e"; // green
  return "#1E5C35";                    // dark green — almost fully captured
}

// ─── Hub data (mutable via state) ─────────────────────────────────────────────

const INITIAL_HUBS: Hub[] = [
  {
    id: 1, name: "Hub Al-Sweifieh", address: "Sweifieh Commercial District",
    lat: 31.9460, lng: 35.8650, active: true, capacityKg: 500,
    currentLoad: { cookingOil: 120, plastic: 34, paper: 18, electronics: 0 },
    schedule: "weekly", nextShipmentDate: "2026-06-26", lastShipmentDate: "2026-06-19",
    status: "collecting",
  },
  {
    id: 2, name: "Hub Downtown", address: "Al-Balad, 1st Circle area",
    lat: 31.9535, lng: 35.9290, active: true, capacityKg: 400,
    currentLoad: { cookingOil: 80, plastic: 15, paper: 42, electronics: 5 },
    schedule: "weekly", nextShipmentDate: "2026-06-27", lastShipmentDate: "2026-06-20",
    status: "collecting",
  },
  {
    id: 3, name: "Hub Jubaiha", address: "Jubaiha North, near University",
    lat: 32.0020, lng: 35.8700, active: true, capacityKg: 300,
    currentLoad: { cookingOil: 0, plastic: 20, paper: 8, electronics: 60 },
    schedule: "monthly", nextShipmentDate: "2026-07-01", lastShipmentDate: "2026-06-01",
    status: "ready",
  },
  {
    id: 4, name: "Hub Abdoun", address: "Abdoun Circle, South Amman",
    lat: 31.9415, lng: 35.8870, active: false, capacityKg: 350,
    currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
    schedule: "weekly", nextShipmentDate: "—", lastShipmentDate: "2026-06-10",
    status: "collecting",
  },
  {
    id: 5, name: "Hub Tabarbour", address: "Tabarbour Industrial Zone",
    lat: 32.0155, lng: 35.9150, active: true, capacityKg: 600,
    currentLoad: { cookingOil: 40, plastic: 55, paper: 80, electronics: 10 },
    schedule: "monthly", nextShipmentDate: "2026-07-05", lastShipmentDate: "2026-06-05",
    status: "collecting",
  },
];

function hubCapacityPct(hub: Hub): number {
  const total = hub.currentLoad.cookingOil + hub.currentLoad.plastic +
    hub.currentLoad.paper + hub.currentLoad.electronics;
  return Math.min(Math.round((total / hub.capacityKg) * 100), 100);
}

function hubCapacityColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 60) return "#f59e0b";
  return "#1E5C35";
}

// ─── Mock rider data ──────────────────────────────────────────────────────────

const RIDERS: Rider[] = [
  {
    id: 1, name: "Ahmad Khalil", nameAr: "أحمد خليل",
    phone: "+962 79 123 4567", lat: 31.9520, lng: 35.9239,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2841", material: "Cooking Oil",      quantity: 45, unit: "L",  address: "Al-Balad, Downtown", status: "inTransit", co2Saved: 112.5, earnings: 18.5 },
      { id: "ORD-2842", material: "Plastic Bottles",  quantity: 12, unit: "kg", address: "Al-Hashmi St",       status: "accepted",  co2Saved: 72,    earnings: 6.0  },
    ],
  },
  {
    id: 2, name: "Omar Hassan", nameAr: "عمر حسن",
    phone: "+962 77 234 5678", lat: 31.9570, lng: 35.8850,
    status: "picking_up", vehicle: "Van",
    orders: [
      { id: "ORD-2838", material: "Cooking Oil", quantity: 80, unit: "L", address: "4th Circle, Amman", status: "pending", co2Saved: 200, earnings: 32.0 },
    ],
  },
  {
    id: 3, name: "Tariq Mansour", nameAr: "طارق منصور",
    phone: "+962 78 345 6789", lat: 31.9440, lng: 35.8710,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2835", material: "Paper & Cardboard", quantity: 34, unit: "kg", address: "Sweifieh",     status: "inTransit", co2Saved: 61.2, earnings: 8.5  },
      { id: "ORD-2836", material: "Plastic Bottles",   quantity:  8, unit: "kg", address: "Tlaa Al-Ali",  status: "accepted",  co2Saved: 48,   earnings: 4.0  },
    ],
  },
  {
    id: 4, name: "Khalid Nasser", nameAr: "خالد ناصر",
    phone: "+962 79 456 7890", lat: 31.9780, lng: 35.8820,
    status: "idle", vehicle: "Van", orders: [],
  },
  {
    id: 5, name: "Yousef Rami", nameAr: "يوسف رامي",
    phone: "+962 77 567 8901", lat: 32.0010, lng: 35.8680,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2830", material: "Electronics", quantity: 15, unit: "kg", address: "Jubaiha", status: "inTransit", co2Saved: 225, earnings: 22.5 },
    ],
  },
  {
    id: 6, name: "Faisal Amin", nameAr: "فيصل أمين",
    phone: "+962 78 678 9012", lat: 31.9400, lng: 35.8850,
    status: "picking_up", vehicle: "Van",
    orders: [
      { id: "ORD-2845", material: "Cooking Oil", quantity: 60, unit: "L", address: "Abdoun",      status: "pending", co2Saved: 150,  earnings: 24.0 },
      { id: "ORD-2846", material: "Cooking Oil", quantity: 25, unit: "L", address: "3rd Circle",  status: "pending", co2Saved: 62.5, earnings: 10.0 },
    ],
  },
  {
    id: 7, name: "Rami Diab", nameAr: "رامي دياب",
    phone: "+962 79 789 0123", lat: 32.0150, lng: 35.9220,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2828", material: "Plastic Bottles", quantity: 20, unit: "kg", address: "Tabarbour", status: "inTransit", co2Saved: 120, earnings: 10.0 },
    ],
  },
  {
    id: 8, name: "Nidal Saad", nameAr: "نضال سعد",
    phone: "+962 77 890 1234", lat: 31.9590, lng: 35.8550,
    status: "delivering", vehicle: "Van",
    orders: [
      { id: "ORD-2820", material: "Paper & Cardboard", quantity: 55, unit: "kg", address: "8th Circle",   status: "inTransit", co2Saved: 99,  earnings: 13.75 },
      { id: "ORD-2821", material: "Electronics",        quantity:  8, unit: "kg", address: "Mecca Mall",   status: "accepted",  co2Saved: 120, earnings: 12.0  },
    ],
  },
  {
    id: 9, name: "Bassam Qasim", nameAr: "بسام قاسم",
    phone: "+962 78 901 2345", lat: 31.9120, lng: 35.9500,
    status: "picking_up", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2848", material: "Cooking Oil", quantity: 30, unit: "L", address: "Airport Road", status: "pending", co2Saved: 75, earnings: 12.0 },
    ],
  },
  {
    id: 10, name: "Imad Saleh", nameAr: "عماد صالح",
    phone: "+962 79 012 3456", lat: 32.0080, lng: 35.8780,
    status: "idle", vehicle: "Van", orders: [],
  },
];

// ─── Derived totals ───────────────────────────────────────────────────────────

function computeTotals() {
  const all = RIDERS.flatMap(r => r.orders);
  const co2 = all.reduce((s, o) => s + o.co2Saved, 0);
  const earnings = all.reduce((s, o) => s + o.earnings, 0);
  const byMaterial: Record<string, number> = {};
  all.forEach(o => { byMaterial[o.material] = (byMaterial[o.material] || 0) + o.quantity; });
  return { co2, earnings, byMaterial };
}

const TOTALS = computeTotals();
const ONLINE_COUNT = RIDERS.filter(r => r.status !== "idle").length;
const AMMAN_CENTER: [number, number] = [31.963, 35.905];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef  = useRef(0);
  useEffect(() => {
    fromRef.current = display; startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / 1400, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * e);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

// ─── Rider marker icons ───────────────────────────────────────────────────────

const MOTO_PATH = "M5 11l1.5-4.5h6L14 9h5v2h-1.27c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1h-4.54c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1H3V9h2zm6-3H8l-.75 2H11V8zm2 0v2h2.25L18 8h-3z";
const VAN_PATH  = "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM11 10V6h5l2.25 4H11zm7 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
const HUB_PATH  = "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z";

function makeRiderIcon(rider: Rider, isSelected: boolean): L.DivIcon {
  const sc = STATUS_CONFIG[rider.status];
  const path = rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH;
  const size = isSelected ? 46 : 38;
  const shadow = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${sc.dot},0 4px 18px rgba(0,0,0,0.22);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
  const firstName = rider.name.split(" ")[0];
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${sc.dot};${shadow}display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="${path}"/></svg>
      <div style="position:absolute;top:${size+5}px;left:50%;transform:translateX(-50%);background:white;border:1.5px solid ${sc.dot};border-radius:20px;padding:2px 8px;font-size:10px;white-space:nowrap;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-weight:600;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.1);">${firstName}</div>
    </div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function makeHubIcon(hub: Hub, isSelected: boolean): L.DivIcon {
  const dotColor = !hub.active ? "#94A3B8"
    : hub.status === "ready"   ? "#C8860A"
    : hub.status === "shipped" ? "#1E40AF"
    : "#1E5C35";
  const size = isSelected ? 44 : 36;
  const shadow = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${dotColor},0 4px 16px rgba(0,0,0,0.2);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.18);`;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:6px;background:${dotColor};${shadow}display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;opacity:${hub.active?1:0.5};">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="${HUB_PATH}"/></svg>
      <div style="position:absolute;top:${size+4}px;left:50%;transform:translateX(-50%);background:white;border:1.5px solid ${dotColor};border-radius:20px;padding:2px 8px;font-size:9px;white-space:nowrap;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-weight:600;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.1);">${hub.name.replace("Hub ", "")}</div>
    </div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

type ViewId = "map" | "heatmap" | "hubs" | "co2" | "reports";

const NAV_ITEMS: { icon: React.ComponentType<{ size: number }>; label: string; id: ViewId }[] = [
  { icon: MapPin,    label: "Live Map",  id: "map"     },
  { icon: Layers,    label: "Heat Map",  id: "heatmap" },
  { icon: Warehouse, label: "Hubs",      id: "hubs"    },
  { icon: BarChart2, label: "CO₂ Stats", id: "co2"     },
  { icon: FileText,  label: "Reports",   id: "reports" },
];

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({ activeNav, onNav }: { activeNav: ViewId; onNav: (id: ViewId) => void }) {
  return (
    <aside className="flex flex-col flex-shrink-0" style={{ width: 200, background: "linear-gradient(180deg,#06402B 0%,#0A5E3E 100%)" }}>
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <img src={dawarLogo} alt="Dawer" style={{ width: 110, height: "auto", objectFit: "contain" }} />
        <div className="mt-2 flex items-center gap-1.5" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80", animation: "pulse 2s ease-in-out infinite" }} />
          OPERATIONS CENTER
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
              style={{ background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.5)" }}
            >
              <item.icon size={16} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono',monospace" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>BUILD 1.0.0</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>AMMAN · JO</div>
      </div>
    </aside>
  );
}

// ─── Live Map view ────────────────────────────────────────────────────────────

function LiveMapLayer({ riders, selectedId, onSelect }: {
  riders: Rider[]; selectedId: number | null; onSelect: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Record<number, L.Marker>>({});
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: AMMAN_CENTER, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: "© OpenStreetMap © CARTO", position: "bottomright" }).addTo(map);
    riders.forEach(rider => {
      const m = L.marker([rider.lat, rider.lng], { icon: makeRiderIcon(rider, false) });
      m.on("click", () => onSelectRef.current(rider.id));
      m.bindTooltip(`<b>${rider.name}</b> · ${rider.vehicle}<br><span style="color:${STATUS_CONFIG[rider.status].color}">${STATUS_CONFIG[rider.status].label}</span>`,
        { direction: "top", offset: [0, -24], className: "rider-tip" });
      m.addTo(map);
      markersRef.current[rider.id] = m;
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current = {}; };
  }, []);

  useEffect(() => {
    riders.forEach(rider => {
      const m = markersRef.current[rider.id];
      if (!m) return;
      m.setIcon(makeRiderIcon(rider, selectedId === rider.id));
      m.setZIndexOffset(selectedId === rider.id ? 1000 : 0);
    });
  }, [selectedId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

function RiderPanel({ riders, selectedId, onSelect, onClose }: {
  riders: Rider[]; selectedId: number | null; onSelect: (id: number) => void; onClose: () => void;
}) {
  const selected = riders.find(r => r.id === selectedId) ?? null;
  return (
    <div className="flex flex-col h-full border-l" style={{ width: 284, flexShrink: 0, borderColor: "#E2E8F0", background: "#F4F6F5" }}>
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>RIDERS ONLINE</span>
        <span className="px-2.5 py-0.5 rounded-full text-white font-semibold" style={{ background: "#1E5C35", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
          {ONLINE_COUNT} / {riders.length}
        </span>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: selected ? 232 : "100%" }}>
        {riders.map(rider => {
          const sc = STATUS_CONFIG[rider.status];
          const isSel = rider.id === selectedId;
          const riderEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
          return (
            <button key={rider.id} onClick={() => onSelect(rider.id)}
              className="w-full text-left px-4 py-3 border-b flex items-center gap-3 transition-colors"
              style={{ borderColor: "#E2E8F0", background: isSel ? "#fff" : "transparent", boxShadow: isSel ? "inset 3px 0 0 #1E5C35" : "none" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill={sc.dot}>
                  <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{rider.name}</span>
                  {rider.orders.length > 0
                    ? <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-bold" style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#C8860A", background: "#FEF3C7" }}>{riderEarnings.toFixed(2)} JD</span>
                    : <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#CBD5E1" }}>—</span>
                  }
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8" }}>{rider.vehicle}</span>
                  {rider.orders.length > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8" }}>· {rider.orders.length} order{rider.orders.length > 1 ? "s" : ""}</span>}
                  <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: sc.color, background: sc.bg }}>{sc.label}</span>
                </div>
              </div>
              <ChevronRight size={14} color="#CBD5E1" />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex-1 overflow-y-auto bg-white border-t" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{selected.name}</div>
              <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 12, color: "#1E5C35" }}>{selected.nameAr}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#64748B" }}>{selected.phone}</div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"><X size={14} color="#94A3B8" /></button>
          </div>
          <div className="p-3 space-y-2.5">
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>CURRENT ORDERS</div>
            {selected.orders.length === 0
              ? <div className="py-6 text-center"><AlertCircle size={22} color="#CBD5E1" className="mx-auto mb-2" /><p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#94A3B8" }}>No active orders</p></div>
              : selected.orders.map(order => {
                const mc = MATERIAL_CONFIG[order.material];
                const os = ORDER_STATUS[order.status];
                return (
                  <div key={order.id} className="rounded-xl p-3 border" style={{ background: mc.bg, borderColor: `${mc.color}30` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: mc.color }}>{order.id}</span>
                      <span className="px-2 py-0.5 rounded-full font-medium" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: os.color, background: os.bg }}>{os.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <mc.Icon size={13} color={mc.color} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#1a1a1a", flex: 1 }}>{order.material}</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: mc.color }}>{order.quantity} {order.unit}</span>
                    </div>
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin size={10} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{order.address}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: `${mc.color}25` }}>
                      <div className="flex items-center gap-1.5">
                        <Leaf size={10} color="#1E5C35" />
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#1E5C35", fontWeight: 500 }}>CO₂ {order.co2Saved.toFixed(1)} kg</span>
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#C8860A", fontWeight: 700 }}>{order.earnings.toFixed(2)} JD</span>
                    </div>
                  </div>
                );
              })
            }
            {selected.orders.length > 0 && (
              <div className="rounded-xl px-3 py-2.5 border" style={{ background: "#D1FAE5", borderColor: "#1E5C3525" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5"><Wind size={12} color="#1E5C35" /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#166534" }}>Rider total CO₂ saved</span></div>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "#1E5C35" }}>{selected.orders.reduce((s, o) => s + o.co2Saved, 0).toFixed(1)} kg</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Heat Map view ────────────────────────────────────────────────────────────

function HeatMapLayer({ districts, selectedId, onSelect }: {
  districts: District[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const polygonsRef   = useRef<Record<string, L.Polygon>>({});
  const onSelectRef   = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: AMMAN_CENTER, zoom: 12, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: "© OpenStreetMap © CARTO", position: "bottomright" }).addTo(map);

    districts.forEach(d => {
      const fillColor = districtFillColor(d);
      const poly = L.polygon(d.polygon as L.LatLngExpression[], {
        color: fillColor, fillColor, fillOpacity: 0.38, weight: 2, opacity: 0.7,
      });
      poly.bindTooltip(
        `<b>${d.name}</b><br>Potential: ${d.co2Potential} kg CO₂/wk<br>Achieved: ${d.co2Achieved} kg<br>Orders: ${d.orderCount}`,
        { direction: "top", className: "rider-tip", sticky: true }
      );
      poly.on("click", () => onSelectRef.current(d.id));
      poly.addTo(map);
      polygonsRef.current[d.id] = poly;

      // centroid pulse circle
      L.circleMarker(d.centroid as L.LatLngExpression, {
        radius: Math.max(6, Math.round(d.co2Potential / 120)),
        color: fillColor, fillColor, fillOpacity: 0.15, weight: 0,
      }).addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; polygonsRef.current = {}; };
  }, []);

  useEffect(() => {
    districts.forEach(d => {
      const poly = polygonsRef.current[d.id];
      if (!poly) return;
      const fillColor = districtFillColor(d);
      const isSelected = d.id === selectedId;
      poly.setStyle({
        color: isSelected ? "#1a1a1a" : fillColor,
        fillOpacity: isSelected ? 0.55 : 0.38,
        weight: isSelected ? 3 : 2,
      });
    });
  }, [selectedId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

function HeatMapPanel({ districts, selectedId, onSelect }: {
  districts: District[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const sorted = [...districts].sort((a, b) => (b.co2Potential - b.co2Achieved) - (a.co2Potential - a.co2Achieved));

  return (
    <div className="flex flex-col h-full border-l" style={{ width: 300, flexShrink: 0, borderColor: "#E2E8F0", background: "#F4F6F5" }}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>CO₂ SAVINGS POTENTIAL</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E2E8F0" }}>
          {(["week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-1.5 text-xs font-semibold transition-colors"
              style={{ fontFamily: "'DM Sans',sans-serif", background: period === p ? "#1E5C35" : "white", color: period === p ? "white" : "#64748B" }}
            >
              {p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 bg-white border-b flex items-center gap-3" style={{ borderColor: "#E2E8F0" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#94A3B8" }}>Unrealized potential:</span>
        {[["#ef4444","High"],["#f59e0b","Med"],["#22c55e","Low"],["#1E5C35","Done"]].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c }} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#64748B" }}>{l}</span>
          </div>
        ))}
      </div>

      {/* District ranking */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((d, i) => {
          const gap = d.co2Potential - d.co2Achieved;
          const gapPct = Math.round((gap / d.co2Potential) * 100);
          const achievedPct = Math.round((d.co2Achieved / d.co2Potential) * 100);
          const fill = districtFillColor(d);
          const mc = MATERIAL_CONFIG[d.topMaterial as keyof typeof MATERIAL_CONFIG];
          const isSelected = d.id === selectedId;
          return (
            <button key={d.id} onClick={() => onSelect(d.id)}
              className="w-full text-left px-4 py-3 border-b transition-colors"
              style={{ borderColor: "#E2E8F0", background: isSelected ? "#fff" : "transparent", boxShadow: isSelected ? "inset 3px 0 0 #1E5C35" : "none" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94A3B8", width: 14 }}>#{i+1}</span>
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: fill }} />
                <span className="flex-1 truncate" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{d.name}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: fill, fontWeight: 700 }}>{gapPct}% gap</span>
              </div>
              {/* Progress bar */}
              <div className="ml-6 mb-1.5">
                <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${achievedPct}%`, background: fill }} />
                </div>
              </div>
              <div className="ml-6 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#94A3B8" }}>Top:</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: mc?.color ?? "#64748B", background: mc?.bg ?? "#F1F5F9" }}>{d.topMaterial}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748B" }}>{d.orderCount} orders</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#1E5C35", fontWeight: 600 }}>{(period === "week" ? d.co2Potential : d.co2Potential * 4).toLocaleString()} kg</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hubs view ────────────────────────────────────────────────────────────────

function HubsMapLayer({ hubs, selectedId, onSelect, placing, onPlace }: {
  hubs: Hub[]; selectedId: number | null; onSelect: (id: number) => void;
  placing: boolean; onPlace: (lat: number, lng: number) => void;
}) {
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
    const map = L.map(containerRef.current, { center: AMMAN_CENTER, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.attribution({ prefix: "© OpenStreetMap © CARTO", position: "bottomright" }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => { if (placingRef.current) onPlaceRef.current(e.latlng.lat, e.latlng.lng); });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current = {}; };
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
      m.on("click", (e: L.LeafletMouseEvent) => { e.originalEvent.stopPropagation(); onSelectRef.current(hub.id); });
      m.bindTooltip(`<b>${hub.name}</b><br>${hub.address}<br><span style="color:${HUB_STATUS_CONFIG[hub.status].color}">${HUB_STATUS_CONFIG[hub.status].label}</span>`,
        { direction: "top", offset: [0, -24], className: "rider-tip" });
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

function HubsPanel({ hubs, setHubs, selectedId, onSelect }: {
  hubs: Hub[]; setHubs: React.Dispatch<React.SetStateAction<Hub[]>>;
  selectedId: number | null; onSelect: (id: number) => void;
}) {
  const selected = hubs.find(h => h.id === selectedId) ?? null;
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleActive = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));

  const scheduleShipment = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id ? { ...h, status: "ready" } : h));

  const markShipped = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id
      ? { ...h, status: "shipped", currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 }, lastShipmentDate: new Date().toISOString().slice(0, 10) }
      : h));

  return (
    <div className="flex flex-col h-full border-l" style={{ width: 300, flexShrink: 0, borderColor: "#E2E8F0", background: "#F4F6F5" }}>
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>COLLECTION HUBS</span>
        <span className="px-2.5 py-0.5 rounded-full text-white font-semibold" style={{ background: "#1E5C35", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
          {hubs.filter(h => h.active).length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hubs.map(hub => {
          const capPct = hubCapacityPct(hub);
          const capColor = hubCapacityColor(capPct);
          const sc = HUB_STATUS_CONFIG[hub.status];
          const isExp = expanded === hub.id;
          const totalLoad = hub.currentLoad.cookingOil + hub.currentLoad.plastic + hub.currentLoad.paper + hub.currentLoad.electronics;

          return (
            <div key={hub.id} className="border-b" style={{ borderColor: "#E2E8F0", background: selectedId === hub.id ? "#fff" : "transparent", boxShadow: selectedId === hub.id ? "inset 3px 0 0 #1E5C35" : "none" }}>
              {/* Hub row */}
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => toggleActive(hub.id)} className="mt-0.5 flex-shrink-0 transition-colors">
                  {hub.active
                    ? <CheckSquare size={18} color="#1E5C35" />
                    : <Square size={18} color="#CBD5E1" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => onSelect(hub.id)} style={{ cursor: "pointer" }}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: hub.active ? "#1a1a1a" : "#94A3B8" }}>{hub.name}</span>
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: sc.color, background: sc.bg, fontFamily: "'DM Sans',sans-serif", fontSize: 10 }}>{sc.label}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{hub.address}</div>

                  {/* Capacity bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${capPct}%`, background: capColor }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: capColor, fontWeight: 600, flexShrink: 0 }}>{capPct}%</span>
                  </div>

                  {/* Material chips */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {hub.currentLoad.cookingOil > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#C8860A", background: "#FEF3C7", borderRadius: 4, padding: "1px 5px" }}>Oil {hub.currentLoad.cookingOil}L</span>}
                    {hub.currentLoad.plastic > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#1E40AF", background: "#DBEAFE", borderRadius: 4, padding: "1px 5px" }}>Plastic {hub.currentLoad.plastic}kg</span>}
                    {hub.currentLoad.paper > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#166534", background: "#DCFCE7", borderRadius: 4, padding: "1px 5px" }}>Paper {hub.currentLoad.paper}kg</span>}
                    {hub.currentLoad.electronics > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#6D28D9", background: "#EDE9FE", borderRadius: 4, padding: "1px 5px" }}>E-waste {hub.currentLoad.electronics}kg</span>}
                    {totalLoad === 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "#94A3B8" }}>Empty</span>}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} color="#94A3B8" />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#94A3B8" }}>
                      {hub.schedule === "weekly" ? "Weekly" : "Monthly"} · Next: {hub.nextShipmentDate}
                    </span>
                  </div>
                </div>

                {/* Expand toggle */}
                <button onClick={() => setExpanded(isExp ? null : hub.id)} className="flex-shrink-0 mt-0.5 p-0.5">
                  {isExp ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="pt-2 flex items-center gap-2">
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>LAST SHIPMENT</div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748B" }}>{hub.lastShipmentDate}</span>
                  </div>
                  <div className="flex gap-2">
                    {hub.status === "collecting" && hub.active && (
                      <button onClick={() => scheduleShipment(hub.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#FEF3C7", color: "#C8860A", fontFamily: "'DM Sans',sans-serif" }}>
                        Schedule Shipment
                      </button>
                    )}
                    {hub.status === "ready" && (
                      <button onClick={() => markShipped(hub.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#D1FAE5", color: "#1E5C35", fontFamily: "'DM Sans',sans-serif" }}>
                        ✓ Mark as Shipped
                      </button>
                    )}
                    {hub.status === "shipped" && (
                      <div className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center" style={{ background: "#DBEAFE", color: "#1E40AF", fontFamily: "'DM Sans',sans-serif" }}>
                        Shipped ✓
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Hub Modal ────────────────────────────────────────────────────────────

function AddHubModal({ lat, lng, onConfirm, onCancel }: {
  lat: number; lng: number;
  onConfirm: (hub: Omit<Hub, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName]         = useState("");
  const [address, setAddress]   = useState(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  const [schedule, setSchedule] = useState<"weekly" | "monthly">("weekly");
  const [capacity, setCapacity] = useState(400);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const today = new Date();
    const next = new Date(today);
    next.setDate(today.getDate() + (schedule === "weekly" ? 7 : 30));
    onConfirm({
      name, address, lat, lng, active: true, capacityKg: capacity,
      currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
      schedule, nextShipmentDate: next.toISOString().slice(0, 10),
      lastShipmentDate: "—", status: "collecting",
    });
  };

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: "#1a1a1a" }}>New Collection Hub</h3>
          <button onClick={onCancel}><X size={16} color="#94A3B8" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Hub Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hub Mecca Mall"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", color: "#1a1a1a" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Address / Description</label>
            <input value={address} onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", color: "#1a1a1a" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Shipment Schedule</label>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E2E8F0" }}>
              {(["weekly", "monthly"] as const).map(s => (
                <button key={s} onClick={() => setSchedule(s)}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{ background: schedule === s ? "#1E5C35" : "white", color: schedule === s ? "white" : "#64748B" }}>
                  {s === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Capacity (kg equiv.)</label>
            <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} min={50} max={2000} step={50}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Mono',monospace", color: "#1a1a1a" }} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors" style={{ background: "#F4F6F5", color: "#64748B" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: name.trim() ? "#1E5C35" : "#94A3B8" }}>
            Add Hub
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ co2, earnings, byMaterial }: { co2: number; earnings: number; byMaterial: Record<string, number> }) {
  return (
    <div className="bg-white border-t flex items-stretch divide-x" style={{ borderColor: "#E2E8F0" }}>
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#D1FAE5" }}><Wind size={16} color="#1E5C35" /></div>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>CO₂ SAVED (LIVE)</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: "#1E5C35", lineHeight: 1.2 }}>
            <AnimatedNumber value={co2} decimals={1} /><span style={{ fontSize: 12, fontWeight: 400, color: "#64748B", marginLeft: 4 }}>kg</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}><Banknote size={16} color="#C8860A" /></div>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>EARNINGS (LIVE)</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: "#C8860A", lineHeight: 1.2 }}>
            <AnimatedNumber value={earnings} decimals={2} /><span style={{ fontSize: 12, fontWeight: 400, color: "#64748B", marginLeft: 4 }}>JD</span>
          </div>
        </div>
      </div>
      {Object.entries(MATERIAL_CONFIG).map(([name, cfg]) => (
        <div key={name} className="flex items-center gap-3 px-4 py-3 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}><cfg.Icon size={15} color={cfg.color} /></div>
          <div className="min-w-0">
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em" }}>{name.toUpperCase()}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
              <AnimatedNumber value={byMaterial[name] ?? 0} /><span style={{ fontSize: 11, fontWeight: 400, color: "#64748B", marginLeft: 3 }}>{cfg.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Placeholder views ────────────────────────────────────────────────────────

function PlaceholderView({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size: number; color: string }>; title: string; desc: string }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#F4F6F5" }}>
      <div className="text-center">
        <Icon size={40} color="#CBD5E1" />
        <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, color: "#94A3B8", marginTop: 12 }}>{title}</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#CBD5E1", marginTop: 6 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView]     = useState<ViewId>("map");
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedHub, setSelectedHub]   = useState<number | null>(null);
  const [hubs, setHubs]                 = useState<Hub[]>(INITIAL_HUBS);
  const [placingHub, setPlacingHub]     = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const time = useClock();

  const handleRiderSelect  = useCallback((id: number) => setSelectedRider(p => p === id ? null : id), []);
  const handleRiderClose   = useCallback(() => setSelectedRider(null), []);
  const handleDistrictSelect = useCallback((id: string) => setSelectedDistrict(p => p === id ? null : id), []);
  const handleHubSelect    = useCallback((id: number) => setSelectedHub(p => p === id ? null : id), []);

  const handlePlace = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setPlacingHub(false);
  }, []);

  const handleAddHub = useCallback((data: Omit<Hub, "id">) => {
    setHubs(prev => [...prev, { ...data, id: Date.now() }]);
    setPendingCoords(null);
  }, []);

  const viewTitle: Record<ViewId, string> = {
    map: "Live Operations Map",
    heatmap: "CO₂ Savings Heat Map",
    hubs: "Collection Hub Management",
    co2: "CO₂ Statistics",
    reports: "Reports",
  };

  const viewSubtitle: Record<ViewId, string> = {
    map: `Amman, Jordan — tracking ${ONLINE_COUNT} active riders`,
    heatmap: "District-level CO₂ savings potential across Amman",
    hubs: `${hubs.filter(h => h.active).length} active hubs · ${hubs.filter(h => h.status === "ready").length} ready to ship`,
    co2: "",
    reports: "",
  };

  return (
    <div className="size-full flex" style={{ fontFamily: "'DM Sans',sans-serif", background: "#F4F6F5" }}>
      <LeftSidebar activeNav={activeView} onNav={v => { setActiveView(v); setSelectedRider(null); setSelectedDistrict(null); setSelectedHub(null); setPlacingHub(false); setPendingCoords(null); }} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{viewTitle[activeView]}</h1>
            {viewSubtitle[activeView] && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{viewSubtitle[activeView]}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Add Hub button */}
            {activeView === "hubs" && (
              <button
                onClick={() => { setPlacingHub(p => !p); setPendingCoords(null); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: placingHub ? "#FEF3C7" : "#1E5C35", color: placingHub ? "#C8860A" : "white" }}
              >
                <Plus size={14} />
                {placingHub ? "Click map to place…" : "Add Hub"}
              </button>
            )}
            <div className="text-right">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em" }}>LOCAL TIME</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>
                {time.toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#D1FAE5" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1E5C35" }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* Main area */}
        <div className="flex flex-1 min-h-0">
          {/* Map / content */}
          <div className="flex-1 relative min-w-0">

            {activeView === "map" && (
              <>
                <LiveMapLayer riders={RIDERS} selectedId={selectedRider} onSelect={handleRiderSelect} />
                {/* Status pills */}
                <div className="absolute top-3 left-3 z-[500] flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = RIDERS.filter(r => r.status === key).length;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{count}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeView === "heatmap" && (
              <>
                <HeatMapLayer districts={DISTRICTS} selectedId={selectedDistrict} onSelect={handleDistrictSelect} />
                {/* Legend overlay */}
                <div className="absolute top-3 left-3 z-[500] px-3 py-2 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 6 }}>CO₂ SAVINGS GAP</div>
                  {[["#ef4444","≥70% unrealized"],["#f59e0b","50–70%"],["#84cc16","30–50%"],["#22c55e","10–30%"],["#1E5C35","< 10%"]].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#64748B" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeView === "hubs" && (
              <>
                <HubsMapLayer hubs={hubs} selectedId={selectedHub} onSelect={handleHubSelect} placing={placingHub} onPlace={handlePlace} />
                {placingHub && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-lg" style={{ background: "#FEF3C7", border: "1.5px solid #C8860A", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#C8860A" }}>Click anywhere on the map to place the hub</span>
                  </div>
                )}
                {/* Hub status pills */}
                <div className="absolute top-3 left-3 z-[500] flex gap-2" style={{ display: placingHub ? "none" : "flex" }}>
                  {Object.entries(HUB_STATUS_CONFIG).map(([key, cfg]) => {
                    const count = hubs.filter(h => h.status === key && h.active).length;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{count}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Add hub modal */}
                {pendingCoords && (
                  <AddHubModal lat={pendingCoords.lat} lng={pendingCoords.lng}
                    onConfirm={handleAddHub} onCancel={() => setPendingCoords(null)} />
                )}
              </>
            )}

            {activeView === "co2" && <PlaceholderView icon={BarChart2} title="CO₂ Statistics" desc="Charts and analytics coming soon" />}
            {activeView === "reports" && <PlaceholderView icon={FileText} title="Reports" desc="Export and reporting tools coming soon" />}
          </div>

          {/* Right panel */}
          {activeView === "map" && (
            <RiderPanel riders={RIDERS} selectedId={selectedRider} onSelect={handleRiderSelect} onClose={handleRiderClose} />
          )}
          {activeView === "heatmap" && (
            <HeatMapPanel districts={DISTRICTS} selectedId={selectedDistrict} onSelect={handleDistrictSelect} />
          )}
          {activeView === "hubs" && (
            <HubsPanel hubs={hubs} setHubs={setHubs} selectedId={selectedHub} onSelect={handleHubSelect} />
          )}
        </div>

        <StatsBar co2={TOTALS.co2} earnings={TOTALS.earnings} byMaterial={TOTALS.byMaterial} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rider-tip { background:white; border:1px solid #E2E8F0; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.12); padding:5px 10px; font-family:'DM Sans',sans-serif; font-size:12px; color:#1a1a1a; white-space:nowrap; }
        .rider-tip::before { display:none; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
    </div>
  );
}
