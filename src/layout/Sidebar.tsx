import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h3>Pure Medical</h3>
      <ul>
        <li>Dashboard</li>
        <li>Admin</li>
        <li onClick={() => window.location.href = "/compare"}>Comparison</li>
      </ul>
    </aside>
  );
}
