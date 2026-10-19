import { useEffect, useState } from "react";
import TransactionTable from "../components/TransactionTable";
import "./Transactions.css"
import { apiFetch } from "../auth";

const API = "http://localhost:3000/api";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `${API}/transactions?page=1&limit=100`
      );

      if (!response.ok) {
        throw new Error("Failed to load transactions.");
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <section className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Review recent predictions saved in the database.</p>
        </div>

        <button onClick={loadTransactions} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

        {error && <p className="error">{error}</p>}

        {loading && <p>Loading transactions...</p>}

        {!loading && !error && (
        <TransactionTable transactions={transactions} />
        )}
    </section>
  );
}

export default Transactions;