interface Segment {
  label: string;
  count: number;
  percent: number;
  color: string;
}

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatusDonut({ segments, total }: { segments: Segment[]; total: number }) {
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="สัดส่วนสถานะการสนทนา">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-base-300)" strokeWidth={STROKE} />
        {segments
          .filter((s) => s.count > 0)
          .map((s) => {
            const dash = (s.percent / 100) * CIRCUMFERENCE;
            const offset = CIRCUMFERENCE - (cumulative / 100) * CIRCUMFERENCE;
            cumulative += s.percent;
            return (
              <circle
                key={s.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            );
          })}
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" fontSize={30} fontWeight={800} fill="var(--color-base-content)">
          {total}
        </text>
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 18}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--color-base-content)"
          opacity={0.45}
        >
          TOTAL
        </text>
      </svg>

      <ul className="flex w-full flex-col gap-2.5 sm:w-auto">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 whitespace-nowrap font-bold text-base-content">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="text-base-content/50">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
