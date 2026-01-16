import { useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import KPICard from "../components/KPICard";
import Charts from "../components/Charts";
import DonutChart from "../components/DonutChart";
import MultiSelect from "../components/MultiSelect";

interface RecordItem {
  date: string;
  location: string;
  source: string;
}

type ViewMode = "YEAR" | "QUARTER" | "MONTH" | "DAY";

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";

export default function Dashboard() {
  /* ================= LOAD DATA (SAFE FOR SSR) ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= MULTI-SELECT FILTER STATE ================= */
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  /* ================= FILTERED DATA ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (
        selectedSources.length > 0 &&
        !selectedSources.includes(r.source)
      )
        return false;

      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(r.location)
      )
        return false;

      return true;
    });
  }, [records, selectedSources, selectedLocations]);

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

  /* ================= AGGREGATION ================= */
  const yearData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const y = new Date(r.date).getFullYear();
      map[y] = (map[y] || 0) + 1;
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
      const d = new Date(r.date);
      const label = `${d.toLocaleString("default", {
        month: "short",
      })} ${d.getFullYear()}`;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([month, value]) => ({
      month,
      value,
    }));
  }, [filteredRecords]);

  const dayData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.date] = (map[r.date] || 0) + 1;
    });
    return Object.entries(map).map(([date, value]) => ({
      date,
      value,
    }));
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

  /* ================= OPTIONS ================= */
  const sourceOptions = [...new Set(records.map((r) => r.source))];
  const locationOptions = [...new Set(records.map((r) => r.location))];

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        {/* KPI */}
        <div className="kpi-grid">
          <KPICard title="Total Appointments" value={totalAppointments} />
          <KPICard title="Top Source" value={topSource} />
          <KPICard title="Top Location" value={topLocation} />
          <KPICard title="Conversion Rate" value="—" />
        </div>

        {/* MULTI-SELECT FILTERS */}
        <div className="filters-card">
          <MultiSelect
            label="Sources"
            options={sourceOptions}
            selected={selectedSources}
            onChange={setSelectedSources}
          />

          <MultiSelect
            label="Locations"
            options={locationOptions}
            selected={selectedLocations}
            onChange={setSelectedLocations}
          />
        </div>

        {/* TIME RANGE */}
        <div className="filters-card">
          <button onClick={() => setViewMode("YEAR")}>Yearly</button>
          <button onClick={() => setViewMode("QUARTER")}>Quarterly</button>
          <button onClick={() => setViewMode("MONTH")}>Monthly</button>
          <button onClick={() => setViewMode("DAY")}>Daily</button>
        </div>

        {/* CHART */}
        {viewMode === "YEAR" && <Charts type="BAR" data={yearData} />}
        {viewMode === "MONTH" && <Charts type="AREA" data={monthData} />}
        {viewMode === "DAY" && <Charts type="LINE" data={dayData} />}
        {viewMode === "QUARTER" && (
          <DonutChart title="Quarter Contribution" data={quarterData} />
        )}

        {/* SECONDARY DONUTS */}
        <div className="secondary-grid">
          <DonutChart title="By Source" data={sourceDonut} />
          <DonutChart title="By Location" data={locationDonut} />
        </div>
      </main>
    </div>
  );
}
