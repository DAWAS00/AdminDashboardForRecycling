import { useEffect } from "react";
import { Play, Pause, Sun, CloudSun, Moon } from "lucide-react";
import { useHeatmapStore } from "../../../stores/heatmapStore";

export function TimelineSlider() {
  const timeOfDay = useHeatmapStore((s) => s.timeOfDay);
  const isPlaying = useHeatmapStore((s) => s.isPlaying);
  const setTimeOfDay = useHeatmapStore((s) => s.setTimeOfDay);
  const togglePlaying = useHeatmapStore((s) => s.togglePlaying);

  const SLOTS = [
    { id: "morning" as const, label: "Morning", hours: "08:00 - 12:00", Icon: Sun },
    { id: "afternoon" as const, label: "Afternoon", hours: "12:00 - 16:00", Icon: CloudSun },
    { id: "evening" as const, label: "Evening", hours: "16:00 - 20:00", Icon: Moon },
  ];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentIndex = SLOTS.findIndex((s) => s.id === timeOfDay);
      const nextIndex = (currentIndex + 1) % SLOTS.length;
      setTimeOfDay(SLOTS[nextIndex].id);
    }, 3500); // Shift every 3.5s

    return () => clearInterval(interval);
  }, [isPlaying, timeOfDay, setTimeOfDay]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 500,
        width: "90%",
        maxWidth: 480,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderRadius: "var(--radius-lg)",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      }}
      className="dark:bg-neutral-900/80 dark:border-neutral-800"
    >
      {/* Play/Pause Trigger */}
      <button
        onClick={togglePlaying}
        aria-label={isPlaying ? "Pause timeline simulation" : "Play timeline simulation"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-full)",
          background: "var(--color-brand-600)",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(30, 92, 53, 0.25)",
          transition: "transform 0.15s, background-color 0.15s",
        }}
        className="hover:scale-105 active:scale-95 focus-ring"
      >
        {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: 2 }} />}
      </button>

      {/* Timeline slots track */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {SLOTS.map((slot, idx) => {
            const active = timeOfDay === slot.id;
            const SlotIcon = slot.Icon;
            return (
              <button
                key={slot.id}
                onClick={() => setTimeOfDay(slot.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 2,
                  padding: 0,
                  width: 80,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "var(--radius-full)",
                    background: active ? "var(--color-brand-600)" : "white",
                    border: `2px solid ${active ? "var(--color-brand-600)" : "var(--color-border)"}`,
                    color: active ? "white" : "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease-in-out",
                    boxShadow: active ? "0 0 0 3px rgba(30, 92, 53, 0.15)" : "none",
                    marginBottom: 4,
                  }}
                  className="dark:bg-neutral-950 dark:border-neutral-800"
                >
                  <SlotIcon size={11} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--color-brand-600)" : "var(--color-text-secondary)",
                    transition: "color 0.2s",
                  }}
                >
                  {slot.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {slot.hours}
                </span>
              </button>
            );
          })}

          {/* Background track line */}
          <div
            style={{
              position: "absolute",
              top: 11,
              left: 40,
              right: 40,
              height: 2,
              background: "var(--color-border)",
              zIndex: 1,
            }}
            className="dark:bg-neutral-800"
          />

          {/* Active progress fill */}
          <div
            style={{
              position: "absolute",
              top: 11,
              left: 40,
              width: timeOfDay === "morning" ? "0%" : timeOfDay === "afternoon" ? "50%" : "100%",
              height: 2,
              background: "var(--color-brand-600)",
              zIndex: 1,
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
