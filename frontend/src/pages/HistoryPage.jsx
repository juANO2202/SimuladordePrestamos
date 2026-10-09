import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { formatMoney } from '../utils/format';
import { Calendar, Layers } from 'lucide-react';

const CREDIT_NAMES = { 1: 'Consumo', 2: 'Hipotecario', 3: 'Educativo' };

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch('/simulator/history');
        if (res.success && res.data) {
          setHistory(res.data);
        } else {
          setError(res.message || 'No se pudo cargar el historial.');
        }
      } catch {
        setError('Error al consultar el servicio de historial.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getMethodName = (methodCode) =>
    methodCode === 1 ? 'Francés · cuota fija' : 'Alemán · cuota decreciente';

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="display">Historial</h1>
        <p className="subhead">Tus últimas 20 simulaciones guardadas.</p>
      </header>

      {loading ? (
        <p className="subhead">Cargando historial…</p>
      ) : error ? (
        <div className="alert alert-error" role="alert">{error}</div>
      ) : history.length === 0 ? (
        <div className="card empty">
          <Layers size={40} />
          <h3 className="headline">Aún no tienes simulaciones</h3>
          <p className="subhead">Calcula tu primer crédito y quedará guardado aquí.</p>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((record) => (
            <article key={record.id} className="card history-card">
              <div className="form-row">
                <span className="chip accent">{CREDIT_NAMES[record.creditTypeCode] || 'Crédito'}</span>
                <span className="caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} />
                  {new Date(record.simulatedAt).toLocaleDateString('es-EC')}
                </span>
              </div>

              <div className="history-amount num">{formatMoney(record.amount)}</div>
              <p className="caption">{getMethodName(record.method)} · {record.termMonths} meses · TEA {record.annualInterestRate}%</p>

              <div className="history-meta">
                <div>
                  <span className="caption">Cuota inicial</span>
                  <strong className="num">{formatMoney(record.initialMonthlyPayment)}</strong>
                </div>
                <div>
                  <span className="caption">Total a pagar</span>
                  <strong className="num">{formatMoney(record.totalAmountPaid)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
