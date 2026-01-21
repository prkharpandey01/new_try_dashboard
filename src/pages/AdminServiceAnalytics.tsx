import { useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import KPICard from "../components/KPICard";
import Charts from "../components/Charts";
import MultiSelect from "../components/MultiSelect";

interface RecordItem {
  date: string;
  source: string;
  location: string;
  service: string;
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

export default function AdminServiceAnalytics() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((r: RecordItem) => r.service); // ONLY_SERVICE
  });

  /* ================= FILTER STATE ================= */
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");

  /* ================= OPTIONS ================= */
  const sourceOptions = [...new Set(records.map((r) => r.source))];
  const serviceOptions = [...new Set(records.map((r) => r.service))];
  const availableYears = [
    ...new Set(records.map((r) => new Date(r.date).getFullYear())),
  ].sort((a, b) => b - a);

  /* ================= FILTERED RECORDS ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

      if (selectedYear !== "ALL" && d.getFullYear() !== selectedYear)
        return false;

      if (
        selectedSources.length > 0 &&
        !selectedSources.includes(r.source)
      )
        return false;

      if (
        selectedServices.length > 0 &&
        !selectedServices.includes(r.service)
      )
        return false;

      return true;
    });
  }, [records, selectedSources, selectedServices, selectedYear]);

  /* ================= KPI ================= */
  const totalAppointments = filteredRecords.length;

  const topSource = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  const topService = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.service] = (map[r.service] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  const topPair = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const key = `${r.source} → ${r.service}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  /* ================= SOURCE × SERVICE CHART ================= */
  const sourceServiceChart = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const key = `${r.source} | ${r.service}`;
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([key, value]) => ({
      name: key,
      value,
    }));
  }, [filteredRecords]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <h2>Service Analytics</h2>

        {/* KPI */}
        <div className="kpi-grid">
          <KPICard title="Total Appointments" value={totalAppointments} />
          <KPICard title="Top Source" value={topSource} />
          <KPICard title="Top Service" value={topService} />
          <KPICard title="Top Source → Service" value={topPair} />
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
            label="Services"
            options={serviceOptions}
            selected={selectedServices}
            onChange={setSelectedServices}
          />

          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "ALL"
                  ? "ALL"
                  : Number(e.target.value)
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

        {/* CHART */}
        <Charts
          type="BAR"
          data={sourceServiceChart}
          xLabel="Source → Service"
          yLabel="Appointments"
        />
      </main>
    </div>
  );
}
