import { useEffect, useMemo, useState } from "react";
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

type ViewMode = "YEAR" | "MONTH" | "WEEK" | "DAY";
type DataMode = "ARCHIVED" | "LIVE";

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";

const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1-NaDFAQ-PWwDZi952bNrYWZ9A4bkPYInFAigQeictWM/gviz/tq?tqx=out:json";

const getWeekNumber = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diff =
    (date.getTime() - firstDay.getTime()) / 86400000 +
    firstDay.getDay() +
    1;
  return Math.ceil(diff / 7);
};

// ✅ Robust parser
const parseSheetDate = (raw: unknown): string | null => {
  if (!raw) return null;

  try {
    if (typeof raw === "string") {
      if (raw.startsWith("Date(")) {
        const parts = raw.match(/\d+/g);
        if (!parts) return null;
        const d = new Date(
          Number(parts[0]),
          Number(parts[1]),
          Number(parts[2])
        );
        return d.toISOString();
      }

      const normalized = raw.replace(" ", "T");
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) return d.toISOString();

      const parts = raw.split(/[- :]/);
      if (parts.length >= 6) {
        const d2 = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          Number(parts[3]),
          Number(parts[4]),
          Number(parts[5])
        );
        return !isNaN(d2.getTime()) ? d2.toISOString() : null;
      }
    }

    if (raw instanceof Date) return raw.toISOString();

    return null;
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [dataMode, setDataMode] = useState<DataMode>("ARCHIVED");
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  const [liveRecords, setLiveRecords] = useState<RecordItem[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");

  const archivedRecords = useMemo<RecordItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RecordItem[]) : [];
    } catch {
      return [];
    }
  }, []);

  // ✅ FIXED FETCH (FULLY DEFENSIVE)
  useEffect(() => {
    if (dataMode !== "LIVE") return;

    let cancelled = false;

    fetch(GOOGLE_SHEET_URL)
      .then((res) => res.text())
      .then((text) => {
        if (cancelled) return;

        try {
          const json = JSON.parse(text.substring(47).slice(0, -2)) as any;

          const rows = json?.table?.rows || [];

          console.log("Rows from API:", rows.length); // ✅ DEBUG

          const parsed: RecordItem[] = rows
            .slice(1)
            .filter((r: any) => r && r.c) // ✅ remove broken/null rows
            .map((r: any) => {
              const cells = r.c;

              const date = parseSheetDate(cells?.[0]?.v);

              return {
                date: date || new Date().toISOString(),
                location:
                  typeof cells?.[1]?.v === "string"
                    ? cells[1].v.trim()
                    : "Unknown",
                source:
                  typeof cells?.[2]?.v === "string"
                    ? cells[2].v.trim()
                    : "Unknown",
              };
            });

          console.log("Parsed records:", parsed.length); // ✅ DEBUG

          setLiveRecords(parsed);
        } catch (err) {
          console.error("Parsing error:", err);
          setLiveRecords([]);
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLiveRecords([]);
      });

    return () => {
      cancelled = true;
    };
  }, [dataMode]);

  const records = useMemo(
    () => (dataMode === "LIVE" ? liveRecords : archivedRecords),
    [dataMode, liveRecords, archivedRecords]
  );

  const loading = dataMode === "LIVE" && liveRecords.length === 0;

  const sourceOptions = [...new Set(records.map((r) => r.source))];
  const locationOptions = [...new Set(records.map((r) => r.location))];
  const availableYears = [
    ...new Set(records.map((r) => new Date(r.date).getFullYear())),
  ].sort((a, b) => b - a);

  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        const d = new Date(r.date);
        if (selectedYear !== "ALL" && d.getFullYear() !== selectedYear)
          return false;
        if (selectedSources.length && !selectedSources.includes(r.source))
          return false;
        if (
          selectedLocations.length &&
          !selectedLocations.includes(r.location)
        )
          return false;
        return true;
      }),
    [records, selectedYear, selectedSources, selectedLocations]
  );

  const yearlyData = useMemo(() => {
    const map: Record<number, number> = {};
    filteredRecords.forEach((r) => {
      const y = new Date(r.date).getFullYear();
      map[y] = (map[y] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
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
      .map((w) => ({ name: `W${w}`, value: map[w] }));
  }, [filteredRecords]);

  // ✅ FIXED DAILY (LOCAL DATE)
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredRecords.forEach((r) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;

      const key =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const sourceDonutData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <div className="filters-card">
          <button
            className={dataMode === "ARCHIVED" ? "active" : ""}
            onClick={() => {
              setDataMode("ARCHIVED");
              setViewMode("MONTH");
            }}
          >
            Archived
          </button>
          <button
            className={dataMode === "LIVE" ? "active" : ""}
            onClick={() => setDataMode("LIVE")}
          >
            Live Data
          </button>
        </div>

        {loading && <p>Loading live data…</p>}

        <div className="kpi-grid">
          <KPICard
            title="Total Appointments"
            value={filteredRecords.length}
          />
        </div>

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

        <div className="filters-card">
          <button onClick={() => setViewMode("YEAR")}>Year</button>
          <button onClick={() => setViewMode("MONTH")}>Month</button>
          <button onClick={() => setViewMode("WEEK")}>Week</button>
          <button
            disabled={dataMode === "ARCHIVED"}
            onClick={() => setViewMode("DAY")}
          >
            Day
          </button>
        </div>

        {viewMode === "YEAR" && <Charts type="BAR" data={yearlyData} />}
        {viewMode === "MONTH" && <Charts type="AREA" data={monthlyData} />}
        {viewMode === "WEEK" && <Charts type="LINE" data={weeklyData} />}
        {viewMode === "DAY" && dataMode === "LIVE" && (
          <Charts type="LINE" data={dailyData} />
        )}

        <DonutChart title="Appointments by Source" data={sourceDonutData} />
      </main>
    </div>
  );
}