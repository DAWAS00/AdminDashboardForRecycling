import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Clock, FileCheck, Hourglass, Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { useReportRequests } from "./useReportRequests";
import { ReportRequestsPanel } from "./ReportRequestsPanel";
import type { ReportRequest } from "./useReportRequests";

// ── colour tokens ─────────────────────────────────────────────────────────────
const C = {
  brand:      "#06402B",
  brandLight: "#D1FAE5",
  amber:      "#D97706",
  amberLight: "#FEF3C7",
  blue:       "#1D4ED8",
  blueLight:  "#DBEAFE",
  green:      "#16A34A",
  greenLight: "#DCFCE7",
  border:     "#E5E7EB",
  neutral50:  "#F9FAFB",
  neutral400: "#9CA3AF",
  neutral700: "#374151",
  neutral900: "#111827",
};

const TEMPLATE_LABELS: Record<ReportRequest["template"], string> = {
  weeklySummary:  "Weekly Summary",
  monthlyInvoice: "Monthly Invoice",
  co2Certificate: "CO₂ Certificate",
  esgReport:      "ESG Report",
};

const TEMPLATE_COLORS: Record<ReportRequest["template"], string> = {
  weeklySummary:  "#06402B",
  monthlyInvoice: "#1D4ED8",
  co2Certificate: "#16A34A",
  esgReport:      "#7C3AED",
};

const STATUS_COLORS = {
  pending:    C.amber,
  processing: C.blue,
  ready:      C.green,
};

// ── helpers ───────────────────────────────────────────────────────────────────
function avgFulfillmentHours(requests: ReportRequest[]): string {
  const fulfilled = requests.filter(
    (r) => r.status === "ready" && r.fulfilledAt,
  );
  if (!fulfilled.length) return "—";
  const totalMs = fulfilled.reduce((acc, r) => {
    return acc + (new Date(r.fulfilledAt!).getTime() - new Date(r.requestedAt).getTime());
  }, 0);
  const avgH = totalMs / fulfilled.length / 3_600_000;
  return avgH < 1 ? `${Math.round(avgH * 60)}m` : `${avgH.toFixed(1)}h`;
}

function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string; bg: string;
}) {
  return (
    <div
      style={{
        flex: 1, background: "white", borderRadius: 12,
        border: `1px solid ${C.border}`, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16,
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 10, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.neutral900, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: C.neutral400, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white", borderRadius: 12, border: `1px solid ${C.border}`,
        padding: "16px 20px", flex: 1, minWidth: 0,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: C.neutral700, marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── main view ─────────────────────────────────────────────────────────────────
export function ReportRequestsView() {
  const { data: requests = [], isLoading, isError, error, refetch } = useReportRequests();

  // ── derived analytics ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = requests.length;
    const pending    = requests.filter((r) => r.status === "pending").length;
    const processing = requests.filter((r) => r.status === "processing").length;
    const ready      = requests.filter((r) => r.status === "ready").length;
    const avgTime    = avgFulfillmentHours(requests);
    return { total, pending, processing, ready, avgTime };
  }, [requests]);

  // by template
  const templateData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of requests) {
      const label = TEMPLATE_LABELS[r.template];
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [requests]);

  // status pie
  const statusData = useMemo(() => [
    { name: "Pending",    value: stats.pending,    color: C.amber  },
    { name: "Processing", value: stats.processing, color: C.blue   },
    { name: "Ready",      value: stats.ready,      color: C.green  },
  ].filter((s) => s.value > 0), [stats]);

  // requests per day (last 14 days)
  const timelineData = useMemo(() => {
    const days = last14Days();
    const countByDay: Record<string, number> = {};
    for (const d of days) countByDay[d] = 0;
    for (const r of requests) {
      const day = r.requestedAt.slice(0, 10);
      if (day in countByDay) countByDay[day]++;
    }
    return days.map((d) => ({
      day: d.slice(5),   // "MM-DD"
      requests: countByDay[d],
    }));
  }, [requests]);

  // by template + status breakdown
  const templateStatusData = useMemo(() => {
    const map: Record<string, { pending: number; processing: number; ready: number }> = {};
    for (const r of requests) {
      const label = TEMPLATE_LABELS[r.template];
      if (!map[label]) map[label] = { pending: 0, processing: 0, ready: 0 };
      map[label][r.status]++;
    }
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [requests]);

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1, overflowY: "auto", padding: 24,
          background: C.neutral50, display: "flex", flexDirection: "column", gap: 20,
        }}
      >
        {/* Stat strip skeleton */}
        <div style={{ display: "flex", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-skeleton" style={{ flex: 1, height: 78, borderRadius: 12, border: "1px solid var(--color-border)" }} />
          ))}
        </div>

        {/* Charts row skeleton */}
        <div style={{ display: "flex", gap: 16 }}>
          <div className="animate-skeleton" style={{ flex: 1, height: 236, borderRadius: 12, border: "1px solid var(--color-border)" }} />
          <div className="animate-skeleton" style={{ flex: 1, height: 236, borderRadius: 12, border: "1px solid var(--color-border)" }} />
        </div>

        {/* Template breakdown skeleton */}
        <div style={{ display: "flex", gap: 16 }}>
          <div className="animate-skeleton" style={{ flex: 1, height: 236, borderRadius: 12, border: "1px solid var(--color-border)" }} />
          <div className="animate-skeleton" style={{ flex: 1, height: 236, borderRadius: 12, border: "1px solid var(--color-border)" }} />
        </div>

        {/* Request queue skeleton */}
        <div className="animate-skeleton" style={{ height: 200, borderRadius: 12, border: "1px solid var(--color-border)" }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, background: C.neutral50, padding: 24 }}>
        <div style={{ background: "white", padding: "32px 40px", borderRadius: 16, boxShadow: "var(--shadow-sm)", textAlign: "center", maxWidth: 400, border: "1px solid var(--color-border)" }}>
          <AlertCircle size={40} color="var(--color-danger-600)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-neutral-900)", marginBottom: 8 }}>Failed to load report requests</h2>
          <p style={{ fontSize: 13, color: "var(--color-neutral-400)", lineHeight: 1.5, marginBottom: 20 }}>{(error as Error)?.message || "A network error occurred. Please verify your connection."}</p>
          <button
            onClick={() => refetch().catch(() => {})}
            className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg text-sm font-semibold transition-colors border"
            style={{
              background: "white",
              color: "var(--color-neutral-700)",
              borderColor: "var(--color-border)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1, overflowY: "auto", padding: 24,
        background: C.neutral50, display: "flex", flexDirection: "column", gap: 20,
      }}
    >
      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16 }}>
        <StatCard
          label="Total Requests"
          value={stats.total}
          sub={stats.total === 0 ? "No requests yet" : undefined}
          icon={Inbox}
          color={C.brand}
          bg={C.brandLight}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          sub={stats.pending > 0 ? "Need action" : undefined}
          icon={Hourglass}
          color={C.amber}
          bg={C.amberLight}
        />
        <StatCard
          label="Avg Fulfillment"
          value={stats.avgTime}
          sub="pending → ready"
          icon={Clock}
          color={C.blue}
          bg={C.blueLight}
        />
        <StatCard
          label="Ready"
          value={stats.ready}
          sub={stats.ready > 0 ? "Available to download" : undefined}
          icon={FileCheck}
          color={C.green}
          bg={C.greenLight}
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Timeline */}
        <ChartCard title="Requests over last 14 days">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.neutral400 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.neutral400 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line
                type="monotone" dataKey="requests" stroke={C.brand}
                strokeWidth={2} dot={{ r: 3, fill: C.brand }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status pie */}
        <ChartCard title="Status breakdown">
          {statusData.length === 0 ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.neutral400, fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                  paddingAngle={3}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Template breakdown ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* By template count */}
        <ChartCard title="Requests by template">
          {templateData.length === 0 ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.neutral400, fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={templateData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.neutral400 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.neutral400 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {templateData.map((entry) => {
                    const key = (Object.keys(TEMPLATE_LABELS) as ReportRequest["template"][])
                      .find((k) => TEMPLATE_LABELS[k] === entry.name);
                    return <Cell key={entry.name} fill={key ? TEMPLATE_COLORS[key] : C.brand} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* By template + status stacked */}
        <ChartCard title="Template × status (stacked)">
          {templateStatusData.length === 0 ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: C.neutral400, fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={templateStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.neutral400 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.neutral400 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pending"    stackId="a" fill={C.amber} radius={[0,0,0,0]} name="Pending" />
                <Bar dataKey="processing" stackId="a" fill={C.blue}  radius={[0,0,0,0]} name="Processing" />
                <Bar dataKey="ready"      stackId="a" fill={C.green} radius={[4,4,0,0]} name="Ready" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Request queue ───────────────────────────────────────────────────── */}
      <ReportRequestsPanel />
    </div>
  );
}
