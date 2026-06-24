import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import {
  Leaf, Droplets, Package, Zap, MapPin, Wind,
  ChevronRight, X, Recycle, BarChart2, FileText, AlertCircle, Banknote,
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
  earnings: number; // JD
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

// ─── Config ───────────────────────────────────────────────────────────────────

const MATERIAL_CONFIG = {
  "Cooking Oil":      { color: "#C8860A", bg: "#FEF3C7", Icon: Droplets, unit: "L" },
  "Plastic Bottles":  { color: "#1E40AF", bg: "#DBEAFE", Icon: Package,  unit: "kg" },
  "Paper & Cardboard":{ color: "#166534", bg: "#DCFCE7", Icon: Package,  unit: "kg" },
  "Electronics":      { color: "#6D28D9", bg: "#EDE9FE", Icon: Zap,      unit: "kg" },
} as const;

const STATUS_CONFIG = {
  delivering: { label: "In Transit",  color: "#1E5C35", bg: "#D1FAE5", dot: "#1E5C35" },
  picking_up: { label: "Picking Up",  color: "#C8860A", bg: "#FEF3C7", dot: "#C8860A" },
  idle:       { label: "Idle",        color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

const ORDER_STATUS = {
  pending:   { label: "Pending",     color: "#C8860A", bg: "#FEF3C7" },
  accepted:  { label: "Accepted",    color: "#1E5C35", bg: "#D1FAE5" },
  inTransit: { label: "In Transit",  color: "#1E40AF", bg: "#DBEAFE" },
  completed: { label: "Completed",   color: "#166534", bg: "#DCFCE7" },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const RIDERS: Rider[] = [
  {
    id: 1, name: "Ahmad Khalil", nameAr: "أحمد خليل",
    phone: "+962 79 123 4567", lat: 31.9520, lng: 35.9239,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2841", material: "Cooking Oil",      quantity: 45, unit: "L",  address: "Al-Balad, Downtown Amman",   status: "inTransit", co2Saved: 112.5, earnings: 18.5 },
      { id: "ORD-2842", material: "Plastic Bottles",  quantity: 12, unit: "kg", address: "Al-Hashmi St, East Amman",   status: "accepted",  co2Saved: 72,    earnings: 6.0 },
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
      { id: "ORD-2835", material: "Paper & Cardboard", quantity: 34, unit: "kg", address: "Sweifieh, Amman",      status: "inTransit", co2Saved: 61.2, earnings: 8.5 },
      { id: "ORD-2836", material: "Plastic Bottles",   quantity:  8, unit: "kg", address: "Tlaa Al-Ali, Amman",   status: "accepted",  co2Saved: 48,   earnings: 4.0 },
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
      { id: "ORD-2830", material: "Electronics", quantity: 15, unit: "kg", address: "Jubaiha, North Amman", status: "inTransit", co2Saved: 225, earnings: 22.5 },
    ],
  },
  {
    id: 6, name: "Faisal Amin", nameAr: "فيصل أمين",
    phone: "+962 78 678 9012", lat: 31.9400, lng: 35.8850,
    status: "picking_up", vehicle: "Van",
    orders: [
      { id: "ORD-2845", material: "Cooking Oil", quantity: 60, unit: "L", address: "Abdoun, Amman",      status: "pending", co2Saved: 150,  earnings: 24.0 },
      { id: "ORD-2846", material: "Cooking Oil", quantity: 25, unit: "L", address: "3rd Circle, Amman",  status: "pending", co2Saved: 62.5, earnings: 10.0 },
    ],
  },
  {
    id: 7, name: "Rami Diab", nameAr: "رامي دياب",
    phone: "+962 79 789 0123", lat: 32.0150, lng: 35.9220,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2828", material: "Plastic Bottles", quantity: 20, unit: "kg", address: "Tabarbour, Amman", status: "inTransit", co2Saved: 120, earnings: 10.0 },
    ],
  },
  {
    id: 8, name: "Nidal Saad", nameAr: "نضال سعد",
    phone: "+962 77 890 1234", lat: 31.9590, lng: 35.8550,
    status: "delivering", vehicle: "Van",
    orders: [
      { id: "ORD-2820", material: "Paper & Cardboard", quantity: 55, unit: "kg", address: "8th Circle, Amman",  status: "inTransit", co2Saved: 99,  earnings: 13.75 },
      { id: "ORD-2821", material: "Electronics",        quantity:  8, unit: "kg", address: "Mecca Mall Area",    status: "accepted",  co2Saved: 120, earnings: 12.0 },
    ],
  },
  {
    id: 9, name: "Bassam Qasim", nameAr: "بسام قاسم",
    phone: "+962 78 901 2345", lat: 31.9120, lng: 35.9500,
    status: "picking_up", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2848", material: "Cooking Oil", quantity: 30, unit: "L", address: "Airport Road, Amman", status: "pending", co2Saved: 75, earnings: 12.0 },
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
  const allOrders = RIDERS.flatMap(r => r.orders);
  const co2 = allOrders.reduce((s, o) => s + o.co2Saved, 0);
  const earnings = allOrders.reduce((s, o) => s + o.earnings, 0);
  const byMaterial: Record<string, number> = {};
  allOrders.forEach(o => { byMaterial[o.material] = (byMaterial[o.material] || 0) + o.quantity; });
  return { co2, earnings, byMaterial };
}

const TOTALS = computeTotals();
const ONLINE_COUNT = RIDERS.filter(r => r.status !== "idle").length;
const AMMAN_CENTER: [number, number] = [31.963, 35.910];

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
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    const duration = 1400;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

// ─── Marker icon builder ──────────────────────────────────────────────────────

const MOTO_PATH = "M5 11l1.5-4.5h6L14 9h5v2h-1.27c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1h-4.54c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1H3V9h2zm6-3H8l-.75 2H11V8zm2 0v2h2.25L18 8h-3z";
const VAN_PATH  = "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM11 10V6h5l2.25 4H11zm7 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";

function makeIcon(rider: Rider, isSelected: boolean): L.DivIcon {
  const sc  = STATUS_CONFIG[rider.status];
  const path = rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH;
  const size = isSelected ? 46 : 38;
  const border = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${sc.dot},0 4px 18px rgba(0,0,0,0.22);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
  const firstName = rider.name.split(" ")[0];

  const html = `
    <div style="width:${size}px;height:${size}px;border-radius:50%;
      background:${sc.dot};${border}
      display:flex;align-items:center;justify-content:center;
      position:relative;cursor:pointer;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="${path}"/>
      </svg>
      <div style="position:absolute;top:${size + 5}px;left:50%;
        transform:translateX(-50%);
        background:white;border:1.5px solid ${sc.dot};border-radius:20px;
        padding:2px 8px;font-size:10px;white-space:nowrap;
        color:#1a1a1a;font-family:'DM Sans',sans-serif;font-weight:600;
        line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
        ${firstName}
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── Live Map (vanilla Leaflet, no react-leaflet) ─────────────────────────────

function LiveMap({ riders, selectedId, onSelect }: {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Record<number, L.Marker>>({});
  const onSelectRef   = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: AMMAN_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    // Attribution (bottom-right, minimal)
    L.control.attribution({ prefix: "© OpenStreetMap © CARTO", position: "bottomright" }).addTo(map);

    riders.forEach(rider => {
      const marker = L.marker([rider.lat, rider.lng], {
        icon: makeIcon(rider, false),
      });
      marker.on("click", () => onSelectRef.current(rider.id));
      marker.bindTooltip(
        `<b>${rider.name}</b> · ${rider.vehicle}<br><span style="color:${STATUS_CONFIG[rider.status].color}">${STATUS_CONFIG[rider.status].label}</span>`,
        { direction: "top", offset: [0, -24], className: "rider-tip" }
      );
      marker.addTo(map);
      markersRef.current[rider.id] = marker;
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Update icons on selection change
  useEffect(() => {
    riders.forEach(rider => {
      const m = markersRef.current[rider.id];
      if (!m) return;
      m.setIcon(makeIcon(rider, selectedId === rider.id));
      m.setZIndexOffset(selectedId === rider.id ? 1000 : 0);
    });
  }, [selectedId]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <style>{`
        .rider-tip {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          padding: 5px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #1a1a1a;
          white-space: nowrap;
        }
        .rider-tip::before { display: none; }
        .leaflet-attribution-flag { display: none !important; }
      `}</style>
    </>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: MapPin,    label: "Live Map", id: "map" },
  { icon: Recycle,   label: "Riders",   id: "riders" },
  { icon: BarChart2, label: "CO₂ Stats",id: "co2" },
  { icon: FileText,  label: "Reports",  id: "reports" },
];

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({ activeNav, onNav }: { activeNav: string; onNav: (id: string) => void }) {
  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{ width: 200, background: "linear-gradient(180deg,#06402B 0%,#0A5E3E 100%)" }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <img
          src={dawarLogo}
          alt="Dawer Logo"
          style={{ width: 110, height: "auto", objectFit: "contain" }}
        />
        <div
          className="mt-2 flex items-center gap-1.5"
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ADE80", animation: "pulse 2s ease-in-out infinite" }}
          />
          OPERATIONS CENTER
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
              style={{
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.5)",
              }}
            >
              <item.icon size={16} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono',monospace" }}
      >
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>BUILD 1.0.0</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>AMMAN · JO</div>
      </div>
    </aside>
  );
}

// ─── Rider Panel ──────────────────────────────────────────────────────────────

function RiderPanel({ riders, selectedId, onSelect, onClose }: {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const selected = riders.find(r => r.id === selectedId) ?? null;

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ width: 284, flexShrink: 0, borderColor: "#E2E8F0", background: "#F4F6F5" }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>
          RIDERS ONLINE
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-white font-semibold"
          style={{ background: "#1E5C35", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}
        >
          {ONLINE_COUNT} / {riders.length}
        </span>
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: selected ? 232 : "100%" }}>
        {riders.map(rider => {
          const sc = STATUS_CONFIG[rider.status];
          const isSel = rider.id === selectedId;
          return (
            <button
              key={rider.id}
              onClick={() => onSelect(rider.id)}
              className="w-full text-left px-4 py-3 border-b flex items-center gap-3 transition-colors"
              style={{
                borderColor: "#E2E8F0",
                background: isSel ? "#ffffff" : "transparent",
                boxShadow: isSel ? "inset 3px 0 0 #1E5C35" : "none",
              }}
            >
              {/* Vehicle icon bubble */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: sc.bg }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={sc.dot}>
                  <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1a1a" }} className="truncate">
                    {rider.name}
                  </span>
                  {rider.orders.length > 0 ? (
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-bold"
                      style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#C8860A", background: "#FEF3C7" }}
                    >
                      {rider.orders.reduce((s, o) => s + o.earnings, 0).toFixed(2)} JD
                    </span>
                  ) : (
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#CBD5E1" }}>—</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8" }}>
                    {rider.vehicle}
                  </span>
                  {rider.orders.length > 0 && (
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8" }}>
                      · {rider.orders.length} order{rider.orders.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span
                    className="px-1.5 py-0.5 rounded-full font-medium"
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: sc.color, background: sc.bg }}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} color="#CBD5E1" />
            </button>
          );
        })}
      </div>

      {/* Selected rider detail */}
      {selected && (
        <div className="flex-1 overflow-y-auto bg-white border-t" style={{ borderColor: "#E2E8F0" }}>
          {/* Detail header */}
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                {selected.name}
              </div>
              <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 12, color: "#1E5C35" }}>
                {selected.nameAr}
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#64748B" }}>
                {selected.phone}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={14} color="#94A3B8" />
            </button>
          </div>

          {/* Orders */}
          <div className="p-3 space-y-2.5">
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>
              CURRENT ORDERS
            </div>

            {selected.orders.length === 0 ? (
              <div className="py-6 text-center">
                <AlertCircle size={22} color="#CBD5E1" className="mx-auto mb-2" />
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#94A3B8" }}>No active orders</p>
              </div>
            ) : (
              selected.orders.map(order => {
                const mc = MATERIAL_CONFIG[order.material];
                const os = ORDER_STATUS[order.status];
                return (
                  <div
                    key={order.id}
                    className="rounded-xl p-3 border"
                    style={{ background: mc.bg, borderColor: `${mc.color}30` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: mc.color }}>
                        {order.id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: os.color, background: os.bg }}
                      >
                        {os.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <mc.Icon size={13} color={mc.color} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#1a1a1a", flex: 1 }}>
                        {order.material}
                      </span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: mc.color }}>
                        {order.quantity} {order.unit}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin size={10} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>
                        {order.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: `${mc.color}25` }}>
                      <div className="flex items-center gap-1.5">
                        <Leaf size={10} color="#1E5C35" />
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#1E5C35", fontWeight: 500 }}>
                          CO₂ {order.co2Saved.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#C8860A", fontWeight: 700 }}>
                          {order.earnings.toFixed(2)} JD
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {selected.orders.length > 0 && (
              <div
                className="rounded-xl px-3 py-2.5 border"
                style={{ background: "#D1FAE5", borderColor: "#1E5C3525" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wind size={12} color="#1E5C35" />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#166534" }}>
                      Rider total CO₂ saved
                    </span>
                  </div>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "#1E5C35" }}>
                    {selected.orders.reduce((s, o) => s + o.co2Saved, 0).toFixed(1)} kg
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ co2, earnings, byMaterial }: { co2: number; earnings: number; byMaterial: Record<string, number> }) {
  return (
    <div className="bg-white border-t flex items-stretch divide-x" style={{ borderColor: "#E2E8F0" }}>
      {/* CO2 */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#D1FAE5" }}>
          <Wind size={16} color="#1E5C35" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>
            CO₂ SAVED (LIVE)
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: "#1E5C35", lineHeight: 1.2 }}>
            <AnimatedNumber value={co2} decimals={1} />
            <span style={{ fontSize: 12, fontWeight: 400, color: "#64748B", marginLeft: 4 }}>kg</span>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 border-r" style={{ borderColor: "#E2E8F0" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
          <Banknote size={16} color="#C8860A" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>
            EARNINGS (LIVE)
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: "#C8860A", lineHeight: 1.2 }}>
            <AnimatedNumber value={earnings} decimals={2} />
            <span style={{ fontSize: 12, fontWeight: 400, color: "#64748B", marginLeft: 4 }}>JD</span>
          </div>
        </div>
      </div>

      {/* Per material */}
      {Object.entries(MATERIAL_CONFIG).map(([name, cfg]) => (
        <div key={name} className="flex items-center gap-3 px-5 py-3 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg }}
          >
            <cfg.Icon size={15} color={cfg.color} />
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em" }}>
              {name.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>
              <AnimatedNumber value={byMaterial[name] ?? 0} />
              <span style={{ fontSize: 11, fontWeight: 400, color: "#64748B", marginLeft: 3 }}>{cfg.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeNav, setActiveNav]   = useState("map");
  const time = useClock();

  const handleSelect = useCallback(
    (id: number) => setSelectedId(prev => prev === id ? null : id),
    []
  );
  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <div className="size-full flex" style={{ fontFamily: "'DM Sans',sans-serif", background: "#F4F6F5" }}>
      <LeftSidebar activeNav={activeNav} onNav={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="bg-white border-b flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
              Live Operations Map
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }}
              />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>
                Amman, Jordan — tracking {ONLINE_COUNT} active riders
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em" }}>
                LOCAL TIME
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>
                {time.toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: "#D1FAE5" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }}
              />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1E5C35" }}>
                LIVE
              </span>
            </div>
          </div>
        </header>

        {/* Map + Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Map */}
          <div className="flex-1 relative min-w-0">
            <LiveMap riders={RIDERS} selectedId={selectedId} onSelect={handleSelect} />

            {/* Status count pills */}
            <div className="absolute top-3 left-3 z-[500] flex gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = RIDERS.filter(r => r.status === key).length;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>
                      {count}
                    </span>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <RiderPanel
            riders={RIDERS}
            selectedId={selectedId}
            onSelect={handleSelect}
            onClose={handleClose}
          />
        </div>

        <StatsBar co2={TOTALS.co2} earnings={TOTALS.earnings} byMaterial={TOTALS.byMaterial} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
