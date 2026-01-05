import React from "react";

export default function GameHistory({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="card bg-dark border-secondary mt-4 shadow-lg">
      <div className="card-header bg-black text-white-50 small-caps py-2">
        <i className="bi bi-clock-history me-2"></i>Historique des Rounds
      </div>
      <div className="card-body p-0">
        <table className="table table-dark table-hover mb-0 small">
          <thead>
            <tr className="text-muted border-secondary">
              <th className="ps-3">ROUND</th>
              <th>OBJ.</th>
              <th>TACTIQUE</th>
              <th className="text-end pe-3">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {history.map((round, index) => (
              <tr key={index} className="border-secondary align-middle">
                <td className="ps-3 fw-bold text-info">Round {index + 1}</td>
                <td className="text-white-50">{round.objectives} VP</td>
                <td>
                  {round.tactic > 0 ? (
                    <span className="text-success">✓ {round.tactic} VP</span>
                  ) : (
                    <span className="text-danger">✗ 0 VP</span>
                  )}
                </td>
                <td className="text-end pe-3 fw-bold text-warning">
                  {round.objectives + round.tactic} VP
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black">
              <td colSpan="3" className="ps-3 fw-bold text-uppercase">Score Total</td>
              <td className="text-end pe-3 fw-bold text-warning fs-5">
                {history.reduce((acc, r) => acc + r.objectives + r.tactic, 0)} VP
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}