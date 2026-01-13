import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Charts({
  data,
  type,
}: {
  data: any[];
  type: "BAR" | "LINE" | "AREA";
}) {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={320}>
        {type === "BAR" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        )}

        {type === "LINE" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="value" stroke="#22d3ee" />
          </LineChart>
        )}

        {type === "AREA" && (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area dataKey="value" fill="#a5b4fc" stroke="#6366f1" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
