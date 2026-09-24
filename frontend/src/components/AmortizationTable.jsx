import React, { useState } from 'react';
import { generateCreditPdf } from '../utils/pdfGenerator';
import { Download, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export const AmortizationTable = ({ simulation, userName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  if (!simulation || !simulation.schedule || simulation.schedule.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(simulation.schedule.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = simulation.schedule.slice(indexOfFirstRow, indexOfLastRow);

  const handleExportPdf = () => {
    generateCreditPdf(simulation, userName);
  };

  return (
    <div className="card animate-fade-in" style={{ padding: '1.75rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <CheckCircle2 color="#10b981" size={20} />
            Tabla de Amortización Oficial
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
            Cronograma detallado con desglose de capital, interés y seguro de desgravamen
          </p>
        </div>

        <span style={{
          background: '#f1f5f9',
          color: '#475569',
          fontSize: '0.8rem',
          fontWeight: '700',
          padding: '0.35rem 0.85rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          {simulation.schedule.length} cuotas
        </span>
      </div>

      <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="custom-table" style={{ fontSize: '0.85rem', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'center', width: '90px', padding: '0.75rem 0.5rem', fontWeight: '800' }}>No. Cuota</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: '700' }}>Saldo Inicial</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#059669', fontWeight: '700' }}>Capital</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#d97706', fontWeight: '700' }}>Interés</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#2563eb', fontWeight: '700' }}>Desgravamen</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: '800', color: '#0f172a', background: '#f1f5f9' }}>Cuota Total</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: '700' }}>Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row) => (
              <tr key={row.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#334155', padding: '0.65rem 0.5rem' }}>{row.month}</td>
                <td style={{ textAlign: 'right', color: '#334155', padding: '0.65rem 0.5rem' }}>
                  ${row.initialBalance.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#059669', padding: '0.65rem 0.5rem' }}>
                  ${row.capitalPaid.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#d97706', padding: '0.65rem 0.5rem' }}>
                  ${row.interestPaid.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600', color: '#2563eb', padding: '0.65rem 0.5rem' }}>
                  ${row.desgravamen.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a', background: '#f8fafc', padding: '0.65rem 0.5rem' }}>
                  ${row.payment.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: '#64748b', padding: '0.65rem 0.5rem' }}>
                  ${row.remainingBalance.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Mostrando cuotas {indexOfFirstRow + 1} a {Math.min(indexOfLastRow, simulation.schedule.length)} de {simulation.schedule.length}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            >
              <ChevronLeft size={15} /> Anterior
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', padding: '0 0.5rem', color: '#0f172a' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            >
              Siguiente <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
