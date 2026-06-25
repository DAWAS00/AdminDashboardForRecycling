interface MetricSparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function MetricSparkline({ data, color, width = 48, height = 18 }: MetricSparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: "block", opacity: 0.55 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
