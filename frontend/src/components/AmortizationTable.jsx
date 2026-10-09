import React, { useState, useEffect } from 'react';
import { generateCreditPdf } from '../utils/pdfGenerator';
import { formatMoney } from '../utils/format';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

export const AmortizationTable = ({ simulation, userName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Al recalcular, volver a la primera página (evita quedar en una página que ya no existe)
  useEffect(() => {
    setCurrentPage(1);
  }, [simulation]);

  if (!simulation || !simulation.schedule || simulation.schedule.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(simulation.schedule.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = simulation.schedule.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="card page">
      <div className="table-head">
        <div>
          <h3 className="title">Tabla de amortización</h3>
          <p className="caption" style={{ marginTop: '0.3rem' }}>
            {simulation.schedule.length} cuotas · capital, interés y seguro de desgravamen
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => generateCreditPdf(simulation, userName)}>
          <Download size={15} /> Descargar PDF
        </button>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th scope="col">Cuota</th>
              <th scope="col">Saldo inicial</th>
              <th scope="col">Capital</th>
              <th scope="col">Interés</th>
              <th scope="col">Desgravamen</th>
              <th scope="col">Pago total</th>
              <th scope="col">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row) => (
              <tr key={row.month}>
                <td className="col-muted">{row.month}</td>
                <td>{formatMoney(row.initialBalance)}</td>
                <td>{formatMoney(row.capitalPaid)}</td>
                <td>{formatMoney(row.interestPaid)}</td>
                <td>{formatMoney(row.desgravamen)}</td>
                <td className="col-total">{formatMoney(row.payment)}</td>
                <td className="col-muted">{formatMoney(row.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pager">
          <span className="caption">
            Cuotas {indexOfFirstRow + 1}–{Math.min(indexOfLastRow, simulation.schedule.length)} de {simulation.schedule.length}
          </span>
          <div className="pager-controls">
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="caption num">{currentPage} / {totalPages}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              aria-label="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
