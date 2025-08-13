// app/components/Sparkline.tsx
"use client";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  TimeSeriesScale,
  Tooltip,
  Filler,
  CategoryScale,
} from "chart.js";

Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  TimeSeriesScale,
  Tooltip,
  Filler
);

type Props = { points: number[] };

export default function Sparkline({ points }: Props) {
  if (!points?.length) return null;
  return (
    <div style={{ height: 40 }}>
      <Line
        data={{
          labels: points.map((_, i) => i.toString()),
          datasets: [
            { data: points, tension: 0.3, fill: false, pointRadius: 0, borderWidth: 2 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    </div>
  );
}
