const WIDTH = 600;
const HEIGHT = 220;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const xc = (p0.x + p1.x) / 2;
    const yc = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x},${p0.y} ${xc},${yc}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

export default function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count)) * 1.2;
  const chartWidth = WIDTH - PAD_X * 2;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = data.map((d, i) => ({
    x: PAD_X + (i / Math.max(1, data.length - 1)) * chartWidth,
    y: PAD_TOP + chartHeight - (d.count / max) * chartHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x},${PAD_TOP + chartHeight} L ${points[0].x},${PAD_TOP + chartHeight} Z`;

  const labelEvery = Math.ceil(data.length / 6);
  const tickIndices: number[] = [];
  for (let i = 0; i < data.length; i += labelEvery) tickIndices.push(i);
  const lastIndex = data.length - 1;
  if (tickIndices[tickIndices.length - 1] !== lastIndex) {
    if (lastIndex - tickIndices[tickIndices.length - 1] < labelEvery / 2) {
      tickIndices[tickIndices.length - 1] = lastIndex;
    } else {
      tickIndices.push(lastIndex);
    }
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="แนวโน้มการสนทนารายวัน">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={PAD_TOP + chartHeight * (1 - f)}
          y2={PAD_TOP + chartHeight * (1 - f)}
          stroke="var(--color-base-300)"
          strokeWidth={1}
        />
      ))}

      <path d={areaPath} fill="url(#trend-fill)" stroke="none" />
      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 0}
          fill="var(--color-primary)"
          stroke="var(--color-base-100)"
          strokeWidth={2}
        />
      ))}

      {tickIndices.map((i) => {
        const d = data[i];
        const anchor = i === 0 ? "start" : i === lastIndex ? "end" : "middle";
        return (
          <text
            key={d.date}
            x={points[i].x}
            y={HEIGHT - 8}
            textAnchor={anchor}
            fontSize={11}
            fontWeight={700}
            fill="var(--color-base-content)"
            opacity={0.4}
          >
            {new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </text>
        );
      })}
    </svg>
  );
}
