import "./TransactionTable.css"
function TransactionTable({ transactions }) {
  return (
    <div className="table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Fraud Probability</th>
            <th>Result</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>₹{Number(transaction.amount).toFixed(2)}</td>
              <td>
                {(Number(transaction.fraud_probability) * 100).toFixed(2)}%
              </td>
              <td>
                <span
                  className={
                    transaction.prediction === 1 ? "fraud" : "legitimate"
                  }
                >
                  {transaction.label}
                </span>
              </td>
              <td>
                {new Date(transaction.created_at).toLocaleString()}
              </td>
            </tr>
          ))}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="5">No transactions recorded yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;