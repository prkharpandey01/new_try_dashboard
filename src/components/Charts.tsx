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

interface ChartsProps {
  data: any[];
  type: "BAR" | "LINE" | "AREA";
  xLabel?: string;
  yLabel?: string;
}

export default function Charts({
  data,
  type,
  xLabel = "",
  yLabel = "",
}: ChartsProps) {
  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={340}>
        {type === "BAR" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={
                xLabel
                  ? { value: xLabel, position: "insideBottom", offset: -5 }
                  : undefined
              }
            />
            <YAxis
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                    }
                  : undefined
              }
            />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        )}

        {type === "LINE" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={
                xLabel
                  ? { value: xLabel, position: "insideBottom", offset: -5 }
                  : undefined
              }
            />
            <YAxis
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                    }
                  : undefined
              }
            />
            <Tooltip />
            <Line dataKey="value" stroke="#22d3ee" strokeWidth={2} />
          </LineChart>
        )}

        {type === "AREA" && (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              label={
                xLabel
                  ? { value: xLabel, position: "insideBottom", offset: -5 }
                  : undefined
              }
            />
            <YAxis
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                    }
                  : undefined
              }
            />
            <Tooltip />
            <Area
              dataKey="value"
              stroke="#6366f1"
              fill="#a5b4fc"
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
