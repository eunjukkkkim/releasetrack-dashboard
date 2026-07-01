import { colorFor, statusLabels } from "./dashboardVisuals";

type ChartTooltipPayload = {
  color?: string;
  fill?: string;
  name?: string | number;
  value?: string | number;
  dataKey?: string | number;
};

/** Recharts 공통 툴팁 — 상태별 색 칩 + 라벨 + 값. 추이/도넛 차트가 공유한다. */
export function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rt-chart-tooltip">
      {label != null && (
        <div className="rt-chart-tooltip-label">{String(label)}</div>
      )}
      <ul className="rt-chart-tooltip-list">
        {payload.map((item, index) => {
          const key = String(item.name ?? item.dataKey ?? index);
          const color = item.color ?? item.fill ?? colorFor(key);
          const labelText =
            statusLabels[key as keyof typeof statusLabels] ?? key;
          return (
            <li key={`${key}-${index}`} className="rt-chart-tooltip-item">
              <span
                className="rt-chart-tooltip-chip"
                style={{ background: color }}
              />
              <span className="rt-chart-tooltip-name" style={{ color }}>
                {labelText}
              </span>
              <span className="rt-chart-tooltip-value">{item.value ?? 0}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
