import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import "./Dashboard.css";
import { apiFetch } from "../auth";

const API = "http://localhost:3000/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/transactions/stats`);

      if (!response.ok) {
        throw new Error("Failed to load statistics.");
      }

      setStats(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of transaction activity.</p>
        </div>

        <button onClick={loadStats} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading && !stats && <p>Loading statistics...</p>}

      {stats && (
        <div className="dashboard-stats">
          <StatCard
            title="Total Transactions"
            value={stats.total_transactions}
          />

          <StatCard
            title="Flagged as Fraud"
            value={stats.fraud_transactions}
          />

          <StatCard
            title="Legitimate Transactions"
            value={stats.legitimate_transactions}
          />
        </div>
      )}
    </section>
  );
}

export default Dashboard;