import { MATERIAL_CONFIG } from "../../constants";

interface MaterialCompositionChartProps {
  byMaterial: Record<string, number>;
}

export function MaterialCompositionChart({ byMaterial }: MaterialCompositionChartProps) {
  const materials = Object.entries(MATERIAL_CONFIG);
  
  // Calculate total across all materials
  const totalValue = Object.values(byMaterial).reduce((sum, v) => sum + v, 0);

  return (
    <div 
      className="bg-white rounded-2xl border border-border p-5 flex flex-col shadow-card hover:shadow-card-hover transition-shadow duration-300"
      style={{ fontFamily: "var(--font-sans)", height: 320 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Material Volume Collected
          </h3>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {totalValue.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              total units processed today
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-600">
          Live Stats
        </div>
      </div>

      {/* Progress Bars List */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {materials.map(([name, cfg]) => {
          const val = byMaterial[name] ?? 0;
          const percentage = totalValue > 0 ? (val / totalValue) * 100 : 0;
          
          return (
            <div key={name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-700">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <cfg.Icon size={12} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-neutral-800 font-semibold">{name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-neutral-900 font-bold" style={{ fontFamily: "var(--font-mono)" }}>
                    {val.toFixed(1)}
                  </span>
                  <span className="text-neutral-400 text-[10px]">{cfg.unit}</span>
                  <span className="text-neutral-300 ml-1">|</span>
                  <span className="text-neutral-500 text-[10px] ml-1 font-semibold">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.max(1, percentage)}%`, 
                    backgroundColor: cfg.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
