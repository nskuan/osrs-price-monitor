// app/page.tsx
import PriceTable from "./components/PriceTable";

export default function Page() {
  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: 0 }}>OSRS Price Monitor</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Live prices via OSRS Wiki. Search for an item to see current low/high, a mid price, and a 1h average.
      </p>
      <PriceTable />
      <footer style={{ marginTop: 24, fontSize: 12, color: "#777" }}>
        Be kind to the API — requests are cached on the server for ~30s.
      </footer>
    </main>
  );
}
