export interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number;
  unit: string;
  address: string;
  deliveryLat: number;
  deliveryLng: number;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
  createdAt: string;     // ISO date, e.g. "2026-06-24"
  completedAt?: string;  // ISO date when status === "completed"
  /** Date.now() when rider accepted this order. Enables the delivery timer badge. */
  acceptedAt?: number;
}

export interface Rider {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  lat: number;
  lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
  /** Date.now() when rider last became idle. Enables the idle warning badge. */
  idleSince?: number;
}

export interface HubMaterials {
  cookingOil: number;
  plastic: number;
  paper: number;
  electronics: number;
}

export interface Hub {
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

/** Per-material CO₂ breakdown within a district */
export interface MaterialBreakdown {
  cookingOil:  { potential: number; achieved: number };
  plastic:     { potential: number; achieved: number };
  paper:       { potential: number; achieved: number };
  electronics: { potential: number; achieved: number };
}

export interface District {
  id: string;
  name: string;
  polygon: [number, number][];
  centroid: [number, number];
  co2Potential: number;
  co2Achieved: number;
  topMaterial: string;
  orderCount: number;
  /** Per-material breakdown — enables material filter layer */
  materialBreakdown: MaterialBreakdown;
}

export type ViewId = "map" | "heatmap" | "hubs" | "partners" | "reports";

/** Heat Map view modes — replaces the three individual toggle booleans */
export type HeatMapViewMode = "overview" | "demand" | "hubs";

/** Material filter for heat map */
export type MaterialFilter = "all" | "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";

/** B2B client business types */
export type ClientType = "restaurant" | "hotel" | "office" | "retail" | "hospital" | "other";

/** B2B client contract tiers */
export type ContractTier = "free" | "basic" | "pro" | "enterprise";

/** A B2B recycling client */
export interface Client {
  id: string;
  name: string;
  nameAr?: string;
  type: ClientType;
  address: string;
  phone: string;
  email: string;
  contractTier: ContractTier;
  joinedDate: string;           // ISO date
  orders: Order[];
  totalCo2Saved: number;        // computed
  totalEarnings: number;        // computed
  // ── Partner & Rewards fields ──────────────────────
  renewalDate: string;          // ISO date of next contract renewal
  billingCycle: "monthly" | "annual";
  greenPoints: number;          // loyalty points earned (1 per kg recycled)
  customPriceJD?: number;       // if set, overrides standard tier price (monthly JD)
  contractNotes?: string;       // free-text admin notes
  lastCertificateDownload?: string; // ISO date of last CO₂ certificate download
  referredBy?: string;          // name of referring partner
}

/** Report template identifiers */
export type ReportType =
  | "weekly-operations"
  | "hub-efficiency"
  | "district-intelligence"
  | "material-pulse"
  | "expansion-opportunity"
  | "co2-certificate";

export interface Route {
  coords: [number, number][];
  distanceKm: number;
  durationSeconds: number;
  adjustedDurationSeconds: number;
  isFallback: boolean;
}

export interface ActiveRoute {
  orderId: string;
  riderId: number;
  route: Route;
  currentCoordIndex: number;
  startedAt: number;
  progressPct: number;
}

export interface CompletedTrip {
  orderId: string;
  riderId: number;
  riderName: string;
  startedAt: number;
  completedAt: number;
  actualSeconds: number;
  osrmEstimateSeconds: number;
  distanceKm: number;
  efficiencyScore: number;
  district: string;
  co2Saved: number;
  earnings: number;
  material: Order["material"];
}
