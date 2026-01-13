import { useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import KPICard from "../components/KPICard";
import Charts from "../components/Charts";
import DonutChart from "../components/DonutChart";

interface RecordItem {
  date: string;
  location: string;
  source: string;
}

type ViewMode = "YEAR" | "QUARTER" | "MONTH" | "DAY";

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";

export default function Dashboard() {
  /* ================= STATE INITIALIZATION (NO useEffect) ================= */
  const [records] = useState<RecordItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const [source, setSource] = useState("ALL");
  const [location, setLocation] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  /* ================= FILTERED DATA ================= */
  const filteredRecords = useMemo(() => {
    return records.filter(
      (r) =>
        (source === "ALL" || r.source === source) &&
        (location === "ALL" || r.location === location)
    );
  }, [records, source, location]);

  /* ================= KPI CALCULATIONS ================= */
  const totalAppointments = filteredRecords.length;

  const topSource = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  const topLocation = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.location] = (map[r.location] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  /* ================= AGGREGATION HELPERS ================= */
  const yearData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const year = new Date(r.date).getFullYear();
      map[year] = (map[year] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const quarterData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const d = new Date(r.date);
      const q = `Q${Math.floor(d.getMonth() / 3) + 1}`;
      map[q] = (map[q] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const monthData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const m = new Date(r.date).toLocaleString("default", { month: "short" });
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([month, value]) => ({ month, value }));
  }, [filteredRecords]);

  const dayData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.date] = (map[r.date] || 0) + 1;
    });
    return Object.entries(map).map(([date, value]) => ({ date, value }));
  }, [filteredRecords]);

  /* ================= DONUT DATA ================= */
  const sourceDonut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const locationDonut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.location] = (map[r.location] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  /* ================= DROPDOWNS ================= */
  const sources = ["ALL", ...new Set(records.map((r) => r.source))];
  const locations = ["ALL", ...new Set(records.map((r) => r.location))];

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        {/* KPI CARDS */}
        <div className="kpi-grid">
          <KPICard title="Total Appointments" value={totalAppointments} />
          <KPICard title="Top Source" value={topSource} />
          <KPICard title="Top Location" value={topLocation} />
          <KPICard title="Conversion Rate" value="—" />
        </div>

        {/* SOURCE / LOCATION FILTERS */}
        <div className="filters-card">
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {sources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* TIME RANGE SELECTOR */}
        <div className="filters-card">
          <button onClick={() => setViewMode("YEAR")}>Yearly</button>
          <button onClick={() => setViewMode("QUARTER")}>Quarterly</button>
          <button onClick={() => setViewMode("MONTH")}>Monthly</button>
          <button onClick={() => setViewMode("DAY")}>Daily</button>
        </div>

        {/* MAIN DYNAMIC CHART */}
        {viewMode === "YEAR" && <Charts type="BAR" data={yearData} />}
        {viewMode === "MONTH" && <Charts type="AREA" data={monthData} />}
        {viewMode === "DAY" && <Charts type="LINE" data={dayData} />}
        {viewMode === "QUARTER" && (
          <DonutChart title="Quarter Contribution" data={quarterData} />
        )}

        {/* SECONDARY DONUTS */}
        <div className="secondary-grid">
          <DonutChart title="Appointments by Source" data={sourceDonut} />
          <DonutChart title="Appointments by Location" data={locationDonut} />
        </div>
      </main>
    </div>
  );
}
