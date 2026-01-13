import { useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import KPICard from "../components/KPICard";
import Charts from "../components/Charts";

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

export default function Comparison() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= FILTERS ================= */
  const [source, setSource] = useState("ALL");
  const [location, setLocation] = useState("ALL");

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

  /* ================= FILTERED DATA (COMPILER SAFE) ================= */
  const dataA = useMemo(() => {
    return records.filter((r) => {
      if (source !== "ALL" && r.source !== source) return false;
      if (location !== "ALL" && r.location !== location) return false;
      const d = new Date(r.date);
      if (fromA && d < new Date(fromA)) return false;
      if (toA && d > new Date(toA)) return false;
      return true;
    });
  }, [records, source, location, fromA, toA]);

  const dataB = useMemo(() => {
    return records.filter((r) => {
      if (source !== "ALL" && r.source !== source) return false;
      if (location !== "ALL" && r.location !== location) return false;
      const d = new Date(r.date);
      if (fromB && d < new Date(fromB)) return false;
      if (toB && d > new Date(toB)) return false;
      return true;
    });
  }, [records, source, location, fromB, toB]);

  /* ================= SUMMARY ================= */
  const summarize = (data: RecordItem[]) => {
    const src: Record<string, number> = {};
    const loc: Record<string, number> = {};

    data.forEach((r) => {
      src[r.source] = (src[r.source] || 0) + 1;
      loc[r.location] = (loc[r.location] || 0) + 1;
    });

    return {
      total: data.length,
      sourceMap: src,
      locationMap: loc,
      topSource: Object.entries(src).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
      topLocation:
        Object.entries(loc).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
    };
  };

  const summaryA = useMemo(() => summarize(dataA), [dataA]);
  const summaryB = useMemo(() => summarize(dataB), [dataB]);

  const growth = calculateGrowth(summaryA.total, summaryB.total);

  /* ================= SOURCE DELTA ================= */
  const sourceDelta = useMemo(() => {
    const allSources = new Set([
      ...Object.keys(summaryA.sourceMap),
      ...Object.keys(summaryB.sourceMap),
    ]);

    const deltas = Array.from(allSources).map((s) => ({
      source: s,
      delta:
        (summaryA.sourceMap[s] || 0) - (summaryB.sourceMap[s] || 0),
    }));

    const best = deltas.sort((a, b) => b.delta - a.delta)[0];
    const worst = deltas.sort((a, b) => a.delta - b.delta)[0];

    return { best, worst };
  }, [summaryA, summaryB]);

  /* ================= CHART ================= */
  const buildDailyChart = (data: RecordItem[]) => {
    const map: Record<string, number> = {};
    data.forEach((r) => {
      map[r.date] = (map[r.date] || 0) + 1;
    });
    return Object.entries(map).map(([date, value]) => ({ date, value }));
  };

  /* ================= EXPORT ================= */
  const exportCSV = () => {
    const rows = [
      ["Range", "Date", "Source", "Location"],
      ...dataA.map((r) => ["A", r.date, r.source, r.location]),
      ...dataB.map((r) => ["B", r.date, r.source, r.location]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "comparison.csv";
    a.click();
  };

  const sources = ["ALL", ...new Set(records.map((r) => r.source))];
  const locations = ["ALL", ...new Set(records.map((r) => r.location))];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <h2>Comparison</h2>

        {/* FILTERS */}
        <div className="filters-card">
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {sources.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button onClick={exportCSV}>Export CSV</button>
        </div>

        {/* PRESETS */}
        <div className="filters-card">
          <button onClick={() => applyPreset("MONTH")}>This Month vs Last Month</button>
          <button onClick={() => applyPreset("QUARTER")}>This Quarter vs Last Quarter</button>
          <button onClick={() => applyPreset("YEAR")}>This Year vs Last Year</button>
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
          <KPICard title="Best Source" value={sourceDelta.best?.source || "—"} />
          <KPICard title="Worst Source" value={sourceDelta.worst?.source || "—"} />
        </div>

        {/* CHARTS */}
        <div className="secondary-grid">
          <Charts type="LINE" data={buildDailyChart(dataA)} />
          <Charts type="LINE" data={buildDailyChart(dataB)} />
        </div>
      </main>
    </div>
  );
}
