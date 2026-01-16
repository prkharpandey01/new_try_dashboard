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

/* ================= DATE HELPERS ================= */
const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const startOfQuarter = (d: Date) =>
  new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

const endOfQuarter = (d: Date) =>
  new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0);

const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);
const endOfYear = (d: Date) => new Date(d.getFullYear(), 11, 31);

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

/* ================= WEEK AGGREGATION ================= */
const getWeekKey = (dateStr: string) => {
  const d = new Date(dateStr);
  const firstDay = new Date(d.getFullYear(), 0, 1);
  const dayOfYear =
    (d.getTime() - firstDay.getTime()) / 86400000 + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
};

export default function Comparison() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= MULTI-SELECT FILTERS ================= */
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  /* ================= DATE RANGES ================= */
  const [fromA, setFromA] = useState("");
  const [toA, setToA] = useState("");
  const [fromB, setFromB] = useState("");
  const [toB, setToB] = useState("");

  /* ================= PRESETS ================= */
  const applyPreset = (preset: "MONTH" | "QUARTER" | "YEAR") => {
    const now = new Date();

    if (preset === "MONTH") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setFromA(formatDate(startOfMonth(now)));
      setToA(formatDate(endOfMonth(now)));
      setFromB(formatDate(startOfMonth(prev)));
      setToB(formatDate(endOfMonth(prev)));
    }

    if (preset === "QUARTER") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setFromA(formatDate(startOfQuarter(now)));
      setToA(formatDate(endOfQuarter(now)));
      setFromB(formatDate(startOfQuarter(prev)));
      setToB(formatDate(endOfQuarter(prev)));
    }

    if (preset === "YEAR") {
      const prev = new Date(now.getFullYear() - 1, 0, 1);
      setFromA(formatDate(startOfYear(now)));
      setToA(formatDate(endOfYear(now)));
      setFromB(formatDate(startOfYear(prev)));
      setToB(formatDate(endOfYear(prev)));
    }
  };

  /* ================= FILTERED DATA ================= */
  const dataA = useMemo(() => {
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

      const d = new Date(r.date);
      if (fromA && d < new Date(fromA)) return false;
      if (toA && d > new Date(toA)) return false;
      return true;
    });
  }, [records, selectedSources, selectedLocations, fromA, toA]);

  const dataB = useMemo(() => {
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

      const d = new Date(r.date);
      if (fromB && d < new Date(fromB)) return false;
      if (toB && d > new Date(toB)) return false;
      return true;
    });
  }, [records, selectedSources, selectedLocations, fromB, toB]);

  /* ================= SUMMARY (BEST / WORST FIXED) ================= */
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
      sourceMap,
    };
  };

  const summaryA = useMemo(() => summarize(dataA), [dataA]);
  const summaryB = useMemo(() => summarize(dataB), [dataB]);

  const growth = calculateGrowth(summaryA.total, summaryB.total);

  /* ================= WEEKLY CHART ================= */
  const buildWeeklyChart = (data: RecordItem[]) => {
    const map: Record<string, number> = {};
    data.forEach((r) => {
      const key = getWeekKey(r.date);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      date: name,
      value,
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

        {/* CONTEXT CARD */}
        <div className="filters-card">
          <strong>Context</strong>
          <div>
            Period A: {fromA || "—"} → {toA || "—"} | Period B:{" "}
            {fromB || "—"} → {toB || "—"}
          </div>
          <div>
            Sources:{" "}
            {selectedSources.length > 0
              ? selectedSources.join(", ")
              : "All"}{" "}
            | Locations:{" "}
            {selectedLocations.length > 0
              ? selectedLocations.join(", ")
              : "All"}
          </div>
          <div>Timezone: IST (GMT +5:30)</div>
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
        </div>

        {/* PRESETS */}
        <div className="filters-card">
          <button onClick={() => applyPreset("MONTH")}>
            This Month vs Last Month
          </button>
          <button onClick={() => applyPreset("QUARTER")}>
            This Quarter vs Last Quarter
          </button>
          <button onClick={() => applyPreset("YEAR")}>
            This Year vs Last Year
          </button>
        </div>

        {/* CUSTOM RANGE */}
        <div className="filters-card">
          <div>
            <strong>Range A</strong>
            <input type="date" value={fromA} onChange={(e) => setFromA(e.target.value)} />
            <input type="date" value={toA} onChange={(e) => setToA(e.target.value)} />
          </div>
          <div>
            <strong>Range B</strong>
            <input type="date" value={fromB} onChange={(e) => setFromB(e.target.value)} />
            <input type="date" value={toB} onChange={(e) => setToB(e.target.value)} />
          </div>
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          <KPICard title="Appointments (A)" value={summaryA.total} />
          <KPICard title="Appointments (B)" value={summaryB.total} />
          <div className="kpi-card">
            <span>Growth</span>
            <h2 style={{ color: growth >= 0 ? "#16a34a" : "#dc2626" }}>
              {growth >= 0 ? "▲" : "▼"} {Math.abs(growth).toFixed(1)}%
            </h2>
          </div>
          <KPICard title="Best Source" value={summaryA.bestSource} />
          <KPICard title="Worst Source" value={summaryA.worstSource} />
        </div>

        {/* WEEKLY COMPARISON CHART */}
        <div className="secondary-grid">
          <Charts type="LINE" data={buildWeeklyChart(dataA)} />
          <Charts type="LINE" data={buildWeeklyChart(dataB)} />
        </div>
      </main>
    </div>
  );
}
