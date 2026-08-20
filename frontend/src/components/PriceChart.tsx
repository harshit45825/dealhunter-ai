import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PricePoint } from "../api";

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const chartData = data.map((d) => ({
    time: new Date(d.recorded_at).toLocaleTimeString(),
    price: parseFloat(d.price),
  }));

  if (chartData.length < 2) {
    return <div className="text-sm text-slate-400 h-32 flex items-center">Collecting price data…</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" hide />
        <YAxis domain={["auto", "auto"]} width={50} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
