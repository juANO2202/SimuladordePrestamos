import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { History, Calendar, Layers } from 'lucide-react';

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
      } catch (err) {
        setError('Error al consultar el servicio de historial.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getCreditName = (typeCode) => {
    switch (typeCode) {
      case 1: return 'Consumo';
      case 2: return 'Hipotecario';
      case 3: return 'Educativo';
      default: return 'Crédito';
    }
  };

  const getMethodName = (methodCode) => {
    return methodCode === 1 ? 'Francés (Cuota Fija)' : 'Alemán (Cuota Decreciente)';
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <History color="#0f172a" size={26} />
          Historial de Simulaciones
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Registro de cotizaciones y solicitudes simuladas previamente.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Cargando historial de simulaciones...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={44} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Sin simulaciones registradas</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Realiza tu primera simulación para guardarla en tu cuenta.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {history.map((record) => (
            <div key={record.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge-dark">
                  {getCreditName(record.creditTypeCode)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} />
                  {new Date(record.simulatedAt).toLocaleDateString('es-EC')}
                </span>
              </div>

              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.3rem' }}>
                ${record.amount.toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Sistema: <strong style={{ color: '#0f172a' }}>{getMethodName(record.method)}</strong> | Plazo: <strong style={{ color: '#0f172a' }}>{record.termMonths} meses</strong>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                background: '#f8fafc',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Cuota Inicial:</span>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>${record.initialMonthlyPayment.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Total a Pagar:</span>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>${record.totalAmountPaid.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
