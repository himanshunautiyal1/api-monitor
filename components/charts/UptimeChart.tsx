"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  day: string;
  uptime: number | null;
}

interface Props {
  data: DataPoint[];
}

export default function UptimeChart({ data }: Props) {
  if (data.every((d) => d.uptime === null)) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No data available yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    uptime: d.uptime ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="day"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const num = typeof raw === "number" ? raw : Number(raw);
            return [`${Number.isFinite(num) ? num : "-"}%`, "Uptime"];
          }}
        />
        <Bar dataKey="uptime" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.uptime >= 99
                  ? "#22c55e"
                  : entry.uptime >= 90
                    ? "#f59e0b"
                    : "#ef4444"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
