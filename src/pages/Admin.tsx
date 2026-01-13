import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";

interface RecordItem {
  date: string;
  location: string;
  source: string;
}

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";
const PAGE_SIZE = 10;

export default function Admin() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [page, setPage] = useState(1);

  // Filters
  const [source, setSource] = useState("ALL");
  const [location, setLocation] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: RecordItem[] = JSON.parse(raw);
      setSorted(data);
    }
  }, []);

  /* ================= HELPERS ================= */
  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");

  const parseDateSafe = (value: any): string | null => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime()))
      return value.toISOString().slice(0, 10);

    if (typeof value === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const parsed = new Date(
        excelEpoch.getTime() + value * 86400000
      );
      return isNaN(parsed.getTime())
        ? null
        : parsed.toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime())
      ? null
      : parsed.toISOString().slice(0, 10);
  };

  const setSorted = (data: RecordItem[]) => {
    const sorted = [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecords(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  /* ================= EXCEL UPLOAD ================= */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    const parsed: RecordItem[] = rows
      .map((row, index) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((k) => {
          normalized[normalizeKey(k)] = row[k];
        });

        const date = parseDateSafe(
          normalized["date"] ||
            normalized["appointmentdate"] ||
            normalized["apptdate"]
        );

        if (!date) return null;

        return {
          date,
          location:
            normalized["location"] ||
            normalized["locationname"] ||
            normalized["city"] ||
            "Unknown",
          source:
            normalized["source"] ||
            normalized["apptsourc e"] ||
            normalized["apptsourc e".replace("_", "")] ||
            normalized["apptsourc e".replace("_", "").toLowerCase()] ||
            normalized["apptsourc e".toLowerCase()] ||
            normalized["apptsourc e"] ||
            "Unknown",
        };
      })
      .filter(Boolean) as RecordItem[];

    setSorted([...records, ...parsed]);
    setPage(1);
  };

  /* ================= FILTERED DATA ================= */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (source !== "ALL" && r.source !== source) return false;
      if (location !== "ALL" && r.location !== location) return false;
      if (fromDate && new Date(r.date) < new Date(fromDate)) return false;
      if (toDate && new Date(r.date) > new Date(toDate)) return false;
      return true;
    });
  }, [records, source, location, fromDate, toDate]);

  /* ================= DROPDOWNS ================= */
  const sources = ["ALL", ...new Set(records.map((r) => r.source))];
  const locations = ["ALL", ...new Set(records.map((r) => r.location))];

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  const visible = filteredRecords.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <h2>Admin Panel</h2>

        {/* FILTER BAR */}
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

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <label className="upload-btn">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleUpload}
            />
          </label>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.location}</td>
                  <td>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
