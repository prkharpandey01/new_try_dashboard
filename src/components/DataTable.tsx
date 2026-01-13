interface Row {
  date: string;
  location: string;
  source: string;
}

export default function DataTable({ rows }: { rows: Row[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Location</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.date}</td>
            <td>{r.location}</td>
            <td>{r.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
