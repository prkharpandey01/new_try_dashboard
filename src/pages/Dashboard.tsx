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

/* ================= WEEK NUMBER ================= */
const getWeekNumber = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diff =
    (date.getTime() - firstDay.getTime()) / 86400000 +
    firstDay.getDay() +
    1;
  return Math.ceil(diff / 7);
};

export default function Dashboard() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecordItem[]) : [];
  });

  /* ================= FILTER STATE ================= */
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  /* ================= OPTIONS ================= */
  const sourceOptions = [...new Set(records.map((r) => r.source))];
  const locationOptions = [...new Set(records.map((r) => r.location))];

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(records.map((r) => new Date(r.date).getFullYear()))
    );
    return years.sort((a, b) => b - a);
  }, [records]);

  /* ================= SINGLE SOURCE OF TRUTH ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

      // Year filter (applies ONLY if specific year selected)
      if (selectedYear !== "ALL" && d.getFullYear() !== selectedYear) {
        return false;
      }

      // Source filter
      if (
        selectedSources.length > 0 &&
        !selectedSources.includes(r.source)
      ) {
        return false;
      }

      // Location filter
      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(r.location)
      ) {
        return false;
      }

      return true;
    });
  }, [records, selectedYear, selectedSources, selectedLocations]);

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

  /* ================= AGGREGATIONS ================= */
  const yearlyData = useMemo(() => {
    const map: Record<number, number> = {};
    filteredRecords.forEach((r) => {
      const y = new Date(r.date).getFullYear();
      map[y] = (map[y] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

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

  /* ================= DONUT DATA ================= */
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

          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
          >
            <option value="ALL">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* VIEW MODE */}
        <div className="filters-card">
          <button onClick={() => setViewMode("YEAR")}>Yearly</button>
          <button onClick={() => setViewMode("QUARTER")}>Quarterly</button>
          <button onClick={() => setViewMode("MONTH")}>Monthly</button>
          <button onClick={() => setViewMode("WEEK")}>Weekly</button>
        </div>

        {/* CHARTS */}
        {viewMode === "YEAR" && (
          <Charts type="BAR" data={yearlyData} />
        )}
        {viewMode === "QUARTER" && (
          <Charts type="BAR" data={quarterlyData} />
        )}
        {viewMode === "MONTH" && (
          <Charts type="AREA" data={monthlyData} />
        )}
        {viewMode === "WEEK" && (
          <Charts type="LINE" data={weeklyData} />
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
