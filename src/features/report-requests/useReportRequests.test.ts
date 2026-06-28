import { vi, describe, it, expect } from "vitest";
import { adaptRow } from "./useReportRequests";

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

describe("adaptRow", () => {
  const baseRow = {
    id: "abc-123",
    user_id: "user-1",
    template: "monthlyInvoice",
    status: "pending",
    period_start: "2026-06-01",
    period_end: "2026-06-30",
    download_url: null,
    requested_at: "2026-06-28T10:00:00Z",
    fulfilled_at: null,
  };

  it("maps snake_case Supabase columns to camelCase ReportRequest", () => {
    const req = adaptRow(baseRow);
    expect(req.id).toBe("abc-123");
    expect(req.userId).toBe("user-1");
    expect(req.template).toBe("monthlyInvoice");
    expect(req.status).toBe("pending");
    expect(req.periodStart).toBe("2026-06-01");
    expect(req.periodEnd).toBe("2026-06-30");
    expect(req.downloadUrl).toBeNull();
    expect(req.requestedAt).toBe("2026-06-28T10:00:00Z");
    expect(req.fulfilledAt).toBeNull();
  });

  it("maps download_url when present", () => {
    const req = adaptRow({ ...baseRow, download_url: "https://cdn.example.com/report.pdf" });
    expect(req.downloadUrl).toBe("https://cdn.example.com/report.pdf");
  });

  it("maps fulfilled_at when present", () => {
    const req = adaptRow({ ...baseRow, fulfilled_at: "2026-06-29T08:00:00Z" });
    expect(req.fulfilledAt).toBe("2026-06-29T08:00:00Z");
  });

  it("handles all four template values", () => {
    const templates = ["weeklySummary", "monthlyInvoice", "co2Certificate", "esgReport"] as const;
    for (const t of templates) {
      const req = adaptRow({ ...baseRow, template: t });
      expect(req.template).toBe(t);
    }
  });

  it("handles all three status values", () => {
    for (const s of ["pending", "processing", "ready"] as const) {
      const req = adaptRow({ ...baseRow, status: s });
      expect(req.status).toBe(s);
    }
  });
});
