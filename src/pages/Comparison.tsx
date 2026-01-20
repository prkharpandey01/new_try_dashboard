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
}

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";

/* ================= HELPERS ================= */

const calculateGrowthPercent = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

const getWeekInfo = (dateStr: string) => {
  const d = new Date(dateStr);
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const dayOfYear =
    (d.getTime() - firstDay.getTime()) / 86400000 + 1;
  const week = Math.ceil(dayOfYear / 7);

  return {
    year: d.getFullYear(),
    week,
    label: `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`,
  };
};

export default function Comparison() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= FILTERS ================= */
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [fromCurrent, setFromCurrent] = useState("");
  const [toCurrent, setToCurrent] = useState("");
  const [fromPrevious, setFromPrevious] = useState("");
  const [toPrevious, setToPrevious] = useState("");

  /* ================= FILTERED DATA ================= */
  const currentData = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

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

      if (fromCurrent && d < new Date(fromCurrent)) return false;
      if (toCurrent && d > new Date(toCurrent)) return false;

      return true;
    });
  }, [records, selectedSources, selectedLocations, fromCurrent, toCurrent]);

  const previousData = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

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

      if (fromPrevious && d < new Date(fromPrevious)) return false;
      if (toPrevious && d > new Date(toPrevious)) return false;

      return true;
    });
  }, [
    records,
    selectedSources,
    selectedLocations,
    fromPrevious,
    toPrevious,
  ]);

  /* ================= SUMMARY ================= */
  const summarize = (data: RecordItem[]) => {
    const sourceMap: Record<string, number> = {};

    data.forEach((r) => {
      sourceMap[r.source] = (sourceMap[r.source] || 0) + 1;
    });

    const sorted = Object.entries(sourceMap).sort(
      (a, b) => b[1] - a[1]
    );

    return {
      total: data.length,
      bestSource: sorted[0]?.[0] || "—",
      worstSource: sorted[sorted.length - 1]?.[0] || "—",
    };
  };

  const currentSummary = useMemo(
    () => summarize(currentData),
    [currentData]
  );
  const previousSummary = useMemo(
    () => summarize(previousData),
    [previousData]
  );

  const growthPercent = calculateGrowthPercent(
    currentSummary.total,
    previousSummary.total
  );

  /* ================= WEEKLY CHART (ORDER FIXED) ================= */
  const buildWeeklyChart = (data: RecordItem[]) => {
    const map: Record<string, { year: number; week: number; count: number }> =
      {};

    data.forEach((r) => {
      const info = getWeekInfo(r.date);
      const key = `${info.year}-${info.week}`;

      if (!map[key]) {
        map[key] = {
          year: info.year,
          week: info.week,
          count: 0,
        };
      }

      map[key].count += 1;
    });

    return Object.values(map)
      .sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.week - b.week
      )
      .map((w) => ({
        name: `${w.year}-W${w.week.toString().padStart(2, "0")}`,
        value: w.count,
      }));
  };

  /* ================= OPTIONS ================= */
  const sourceOptions = [...new Set(records.map((r) => r.source))];
  const locationOptions = [...new Set(records.map((r) => r.location))];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <h2>Comparison</h2>

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
        </div>

        {/* DATE RANGES */}
        <div className="filters-card">
          <div>
            <strong>Current Period</strong>
            <input
              type="date"
              value={fromCurrent}
              onChange={(e) => setFromCurrent(e.target.value)}
            />
            <input
              type="date"
              value={toCurrent}
              onChange={(e) => setToCurrent(e.target.value)}
            />
          </div>

          <div>
            <strong>Previous Period</strong>
            <input
              type="date"
              value={fromPrevious}
              onChange={(e) => setFromPrevious(e.target.value)}
            />
            <input
              type="date"
              value={toPrevious}
              onChange={(e) => setToPrevious(e.target.value)}
            />
          </div>
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          <KPICard title="Appointments (Current)" value={currentSummary.total} />
          <KPICard
            title="Appointments (Previous)"
            value={previousSummary.total}
          />
          <div className="kpi-card">
            <span>Growth</span>
            <h2 style={{ color: growthPercent >= 0 ? "#16a34a" : "#dc2626" }}>
              {growthPercent >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(growthPercent).toFixed(1)}%
            </h2>
          </div>
          <KPICard
            title="Best Source (Current)"
            value={currentSummary.bestSource}
          />
          <KPICard
            title="Worst Source (Current)"
            value={currentSummary.worstSource}
          />
        </div>

        {/* WEEKLY COMPARISON (ORDERED) */}
        <div className="secondary-grid">
          <Charts
            type="LINE"
            data={buildWeeklyChart(currentData)}
            xLabel="Time"
            yLabel="Appointments"
          />
          <Charts
            type="LINE"
            data={buildWeeklyChart(previousData)}
            xLabel="Time"
            yLabel="Appointments"
          />
        </div>
      </main>
    </div>
  );
}
