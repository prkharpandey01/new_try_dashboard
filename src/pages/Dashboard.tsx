import { useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import KPICard from "../components/KPICard";
import Charts from "../components/Charts";
import DonutChart from "../components/DonutChart";
import MultiSelect from "../components/MultiSelect";

interface RecordItem {
  date: string;
  source: string;
  location: string;
}

type ViewMode = "YEAR" | "QUARTER" | "MONTH" | "WEEK";

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";

/* ================= WEEK NUMBER (ISO-LIKE, BUSINESS FRIENDLY) ================= */
const getWeekNumber = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diff =
    (date.getTime() - firstDay.getTime()) / 86400000 +
    firstDay.getDay() +
    1;
  return Math.ceil(diff / 7);
};

export default function Dashboard() {
  /* ================= LOAD DATA (SSR SAFE) ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= FILTER STATE ================= */
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  /* ================= AVAILABLE YEARS ================= */
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(records.map((r) => new Date(r.date).getFullYear()))
    );
    return years.sort((a, b) => b - a);
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears[0] || new Date().getFullYear()
  );

  /* ================= FILTERED RECORDS ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

      if (viewMode !== "YEAR" && d.getFullYear() !== selectedYear)
        return false;

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
  }, [
    records,
    selectedSources,
    selectedLocations,
    selectedYear,
    viewMode,
  ]);

  /* ================= KPI ================= */
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

  /* ================= AGGREGATIONS (ORDERED CORRECTLY) ================= */

  // YEARLY (all years)
  const yearlyData = useMemo(() => {
    const map: Record<number, number> = {};
    records.forEach((r) => {
      const y = new Date(r.date).getFullYear();
      map[y] = (map[y] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [records]);

  // QUARTERLY (Q1 → Q4)
  const quarterlyData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const q = `Q${Math.floor(new Date(r.date).getMonth() / 3) + 1}`;
      map[q] = (map[q] || 0) + 1;
    });
    return ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
      name: q,
      value: map[q] || 0,
    }));
  }, [filteredRecords]);

  // MONTHLY (Jan → Dec)
  const monthlyData = useMemo(() => {
    const map: Record<number, number> = {};
    filteredRecords.forEach((r) => {
      const m = new Date(r.date).getMonth();
      map[m] = (map[m] || 0) + 1;
    });

    return Array.from({ length: 12 }, (_, m) => ({
      name: new Date(0, m).toLocaleString("default", { month: "short" }),
      value: map[m] || 0,
    }));
  }, [filteredRecords]);

  // WEEKLY (W01 → W52, latest on right)
  const weeklyData = useMemo(() => {
    const map: Record<number, number> = {};
    filteredRecords.forEach((r) => {
      const w = getWeekNumber(new Date(r.date));
      map[w] = (map[w] || 0) + 1;
    });

    return Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map((w) => ({
        name: `W${w.toString().padStart(2, "0")}`,
        value: map[w],
      }));
  }, [filteredRecords]);

  /* ================= DONUT DATA (TYPE SAFE) ================= */
  const sourceDonutData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const locationDonutData = useMemo(() => {
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
          <KPICard title="Timezone" value="IST (GMT +5:30)" />
        </div>

        {/* CONTEXT */}
        <div className="filters-card">
          <strong>Context:</strong>
          <span>
            View: {viewMode} | Year:{" "}
            {viewMode === "YEAR" ? "All" : selectedYear}
          </span>
          <span>
            Sources:{" "}
            {selectedSources.length > 0
              ? selectedSources.join(", ")
              : "All"}
          </span>
          <span>
            Locations:{" "}
            {selectedLocations.length > 0
              ? selectedLocations.join(", ")
              : "All"}
          </span>
        </div>

        {/* FILTERS */}
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

          {viewMode !== "YEAR" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* VIEW MODE */}
        <div className="filters-card">
          <button onClick={() => setViewMode("YEAR")}>Yearly</button>
          <button onClick={() => setViewMode("QUARTER")}>Quarterly</button>
          <button onClick={() => setViewMode("MONTH")}>Monthly</button>
          <button onClick={() => setViewMode("WEEK")}>Weekly</button>
        </div>

        {/* CHART */}
        {viewMode === "YEAR" && (
          <Charts
            type="BAR"
            data={yearlyData}
            xLabel="Time"
            yLabel="Appointments"
          />
        )}

        {viewMode === "QUARTER" && (
          <Charts
            type="BAR"
            data={quarterlyData}
            xLabel="Time"
            yLabel="Appointments"
          />
        )}

        {viewMode === "MONTH" && (
          <Charts
            type="AREA"
            data={monthlyData}
            xLabel="Time"
            yLabel="Appointments"
          />
        )}

        {viewMode === "WEEK" && (
          <Charts
            type="LINE"
            data={weeklyData}
            xLabel="Time"
            yLabel="Appointments"
          />
        )}

        {/* DONUTS */}
        <div className="secondary-grid">
          <DonutChart title="Appointments by Source" data={sourceDonutData} />
          <DonutChart
            title="Appointments by Location"
            data={locationDonutData}
          />
        </div>
      </main>
    </div>
  );
}
