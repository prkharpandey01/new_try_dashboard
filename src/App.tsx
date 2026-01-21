import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Comparison from "./pages/Comparison";
import AdminServiceAnalytics from "./pages/AdminServiceAnalytics";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      <Route path="/compare" element={<Comparison />} />
<Route path="/services" element={<AdminServiceAnalytics />} />
      </Routes>
    </BrowserRouter>
  );
}
