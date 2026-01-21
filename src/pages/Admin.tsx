import { useState } from "react";
import * as XLSX from "xlsx";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";

interface RecordItem {
  date: string;
  location: string;
  source: string;
  service?: string;
}

type ExcelRow = Record<string, unknown>;

const STORAGE_KEY = "PURE_MEDICAL_RECORDS";
const PAGE_SIZE = 20;

export default function Admin() {
  /* ================= SAFE INITIAL LOAD ================= */
  const [records, setRecords] = useState<RecordItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RecordItem[]) : [];
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState<number>(1);

  /* ================= EXCEL UPLOAD ================= */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (!(result instanceof ArrayBuffer)) return;

      const data = new Uint8Array(result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
        raw: true,
      });

      const parsed: RecordItem[] = rows.map((row) => {
        /* ---------- DATE ---------- */
        let date: string;
        const rawDate = row["Date"];

        if (typeof rawDate === "number") {
          const d = XLSX.SSF.parse_date_code(rawDate);
          date = `${d.y}-${String(d.m).padStart(2, "0")}-${String(
            d.d
          ).padStart(2, "0")}`;
        } else {
          date = new Date(String(rawDate))
            .toISOString()
            .split("T")[0];
        }

        return {
          date,
          location:
            typeof row["Location"] === "string"
              ? row["Location"].trim()
              : "Unknown",
          source:
            typeof row["Appt_Source"] === "string"
              ? row["Appt_Source"].trim()
              : "Unknown",
          service:
            typeof row["Service"] === "string"
              ? row["Service"].trim()
              : undefined,
        };
      });

      const merged = [...records, ...parsed];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      setRecords(merged);
      setPage(1);

      alert(`Uploaded ${parsed.length} records successfully`);
    };

    reader.readAsArrayBuffer(file);
  };

  /* ================= SORT + PAGINATION ================= */
  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        <h2>Admin Panel</h2>

        {/* Upload */}
        <label className="upload-btn">
          Upload Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={handleUpload}
          />
        </label>

        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Source</th>
                <th>Service</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.location}</td>
                  <td>{r.source}</td>
                  <td>{r.service ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
