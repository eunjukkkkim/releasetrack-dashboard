import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummaryResponse } from "../../api/types";
import { EmptyBox } from "../../components/StateBox";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SelectItem } from "../../components/ui/select";
import { CardControlSelect } from "./DashboardBlock";
import { ChartTooltip } from "./ChartTooltip";
import {
  hasTrendData,
  selectStatusStats,
  selectStatusTrend,
  type StatusDistScope,
} from "./dashboardBlocks";
import { TREND_BUCKETS, colorFor, statusLabels } from "./dashboardVisuals";

export function TrendCard({ summary }: { summary: DashboardSummaryResponse }) {
  const trend = selectStatusTrend(summary);
  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>최근 7일 배포 추이</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasTrendData(trend) ? (
          <EmptyBox description="최근 7일 배포 이력이 없습니다." />
        ) : (
          <>
            <ul className="rt-chart-legend rt-chart-legend--top">
              {TREND_BUCKETS.map((bucket) => (
                <li key={bucket.key}>
                  <span
                    className="rt-legend-chip"
                    style={{ background: bucket.color }}
                  />
                  <span style={{ color: bucket.color }}>{bucket.label}</span>
                </li>
              ))}
            </ul>
            <ResponsiveContainer width="100%" height={272}>
              <BarChart data={trend.points} barCategoryGap="28%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#dfe1e6"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(5)}
                  tick={{ fill: "#6b778c", fontSize: 12 }}
                  axisLine={{ stroke: "#dfe1e6" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b778c", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "rgba(9,30,66,0.06)" }}
                  content={<ChartTooltip />}
                />
                {TREND_BUCKETS.map((bucket) => (
                  <Bar
                    key={bucket.key}
                    dataKey={bucket.key}
                    name={bucket.label}
                    stackId="status"
                    fill={bucket.color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusDistCard({
  summary,
}: {
  summary: DashboardSummaryResponse;
}) {
  const [scope, setScope] = useState<StatusDistScope>("ALL");
  const stats = selectStatusStats(summary, scope);
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  const hasData = total > 0;
  return (
    <Card className="chart-card">
      <CardHeader className="rt-card-header-row">
        <CardTitle>상태별 배포 분포</CardTitle>
        <CardControlSelect
          value={scope}
          onValueChange={(val) => setScope(val as StatusDistScope)}
          ariaLabel="상태 분포 환경 선택"
        >
          <SelectItem value="ALL">전체</SelectItem>
          <SelectItem value="DEV">DEV</SelectItem>
          <SelectItem value="STAGING">STAGING</SelectItem>
          <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
        </CardControlSelect>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyBox description="해당 범위의 배포 분포가 없습니다." />
        ) : (
          <div className="rt-donut">
            <div className="rt-donut-chart">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={66}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {stats.map((entry) => (
                      <Cell key={entry.status} fill={colorFor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="rt-donut-center">
                <div className="rt-donut-total">{total}</div>
                <div className="rt-donut-caption">TOTAL</div>
              </div>
            </div>
            <ul className="rt-donut-legend">
              {stats.map((entry) => (
                <li key={entry.status}>
                  <span
                    className="rt-legend-chip"
                    style={{ background: colorFor(entry.status) }}
                  />
                  <span style={{ color: colorFor(entry.status) }}>
                    {statusLabels[entry.status] ?? entry.status}
                  </span>
                  <span className="rt-legend-count">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
