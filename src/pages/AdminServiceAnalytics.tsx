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
  service?: string;
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

export default function Services() {
  /* ================= LOAD DATA ================= */
  const [records] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  /* ================= STATE ================= */
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH");

  /* ================= OPTIONS ================= */
  const serviceOptions = [
    ...new Set(records.map((r) => r.service).filter(Boolean)),
  ] as string[];

  const locationOptions = [
    ...new Set(records.map((r) => r.location)),
  ];

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(records.map((r) => new Date(r.date).getFullYear()))
    );
    return years.sort((a, b) => b - a);
  }, [records]);

  /* ================= FILTERED RECORDS ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = new Date(r.date);

      if (
        viewMode !== "YEAR" &&
        selectedYear !== "ALL" &&
        d.getFullYear() !== selectedYear
      ) {
        return false;
      }

      if (
        selectedServices.length > 0 &&
        (!r.service || !selectedServices.includes(r.service))
      ) {
        return false;
      }

      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(r.location)
      ) {
        return false;
      }

      return true;
    });
  }, [
    records,
    selectedServices,
    selectedLocations,
    selectedYear,
    viewMode,
  ]);

  /* ================= KPI ================= */
  const totalAppointments = filteredRecords.length;

  const topService = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      if (!r.service) return;
      map[r.service] = (map[r.service] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [filteredRecords]);

  /* ================= AGGREGATIONS ================= */
  const aggregateBy = (keyFn: (r: RecordItem) => string) => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const key = keyFn(r);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  const yearlyData = aggregateBy(
    (r) => String(new Date(r.date).getFullYear())
  );

  const quarterlyData = aggregateBy(
    (r) => `Q${Math.floor(new Date(r.date).getMonth() / 3) + 1}`
  );

  const monthlyData = aggregateBy(
    (r) =>
      new Date(r.date).toLocaleString("default", {
        month: "short",
      })
  );

  const weeklyData = aggregateBy(
    (r) => `W${getWeekNumber(new Date(r.date))}`
  );

  /* ================= DONUT ================= */
  const serviceDonut = aggregateBy((r) => r.service || "Unknown");

  /* ================= LOCATION → BEST SERVICE TABLE ================= */
  const locationServiceTable = useMemo(() => {
    const result: {
      location: string;
      service: string;
      count: number;
    }[] = [];

    const locationMap: Record<string, Record<string, number>> = {};

    records.forEach((r) => {
      if (!r.service) return;
      if (!locationMap[r.location]) {
        locationMap[r.location] = {};
      }
      locationMap[r.location][r.service] =
        (locationMap[r.location][r.service] || 0) + 1;
    });

    Object.entries(locationMap).forEach(([location, services]) => {
      const [service, count] =
        Object.entries(services).sort((a, b) => b[1] - a[1])[0];

      result.push({ location, service, count });
    });

    return result;
  }, [records]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        {/* KPI */}
        <div className="kpi-grid">
          <KPICard title="Total Appointments" value={totalAppointments} />
          <KPICard title="Top Service" value={topService} />
        </div>

        {/* FILTERS */}
        <div className="filters-card">
          <MultiSelect
            label="Services"
            options={serviceOptions}
            selected={selectedServices}
            onChange={setSelectedServices}
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

        {/* CHART */}
        {viewMode === "YEAR" && <Charts type="BAR" data={yearlyData} />}
        {viewMode === "QUARTER" && <Charts type="BAR" data={quarterlyData} />}
        {viewMode === "MONTH" && <Charts type="AREA" data={monthlyData} />}
        {viewMode === "WEEK" && <Charts type="LINE" data={weeklyData} />}

        {/* DONUT */}
        <DonutChart title="Appointments by Service" data={serviceDonut} />

        {/* LOCATION TABLE */}
        <h3 style={{ marginTop: 32 }}>Best Service by Location</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Best Service</th>
              <th>Appointments</th>
            </tr>
          </thead>
          <tbody>
            {locationServiceTable.map((r) => (
              <tr key={r.location}>
                <td>{r.location}</td>
                <td>{r.service}</td>
                <td>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
