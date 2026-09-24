import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AmortizationTable } from '../components/AmortizationTable';
import { generateCreditPdf } from '../utils/pdfGenerator';
import { Download, FileText, AlertCircle } from 'lucide-react';

export const SimulatorPage = () => {
  const { user } = useAuth();
  const amountInputRef = useRef(null);

  const [creditTypes, setCreditTypes] = useState([
    { id: 1, typeCode: 1, name: 'Crédito Consumo Ágil Banco', category: 'Consumo Prioritario', annualInterestRate: 15.5, minMonths: 1, maxMonths: 360, minAmount: 50, maxAmount: 50000 },
    { id: 2, typeCode: 2, name: 'Crédito Hipotecario Vivienda', category: 'Hipotecario', annualInterestRate: 9.5, minMonths: 12, maxMonths: 360, minAmount: 3000, maxAmount: 500000 },
    { id: 3, typeCode: 3, name: 'Crédito Educativo Superior', category: 'Educativo', annualInterestRate: 8.0, minMonths: 6, maxMonths: 120, minAmount: 500, maxAmount: 80000 }
  ]);

  const [selectedTypeCode, setSelectedTypeCode] = useState(1);
  const [loanAmount, setLoanAmount] = useState(500); // Valor numérico puro enviado al backend
  const [displayAmount, setDisplayAmount] = useState('500'); // Texto formateado con puntos para la vista
  const [periodicity, setPeriodicity] = useState('Mensual (Cuotas cada 30 días)');
  const [termUnit, setTermUnit] = useState('meses'); // 'meses' | 'años'
  const [termValue, setTermValue] = useState(5); // Valor mostrado en la UI
  const [termMonths, setTermMonths] = useState(5); // Valor en meses enviado al backend
  const [method, setMethod] = useState(1); // 1 = Francés, 2 = Alemán
  const [institutionType, setInstitutionType] = useState('Banco');

  const handleTermValueChange = (val) => {
    setTermValue(val);
    const num = Number(val) || 0;
    if (termUnit === 'años') {
      setTermMonths(Math.round(num * 12));
    } else {
      setTermMonths(num);
    }
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit === termUnit) return;
    setTermUnit(newUnit);
    if (newUnit === 'años') {
      const years = termMonths >= 12 ? Math.round(termMonths / 12) : 1;
      setTermValue(years);
      setTermMonths(years * 12);
    } else {
      const months = termMonths || 12;
      setTermValue(months);
      setTermMonths(months);
    }
  };

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manejador nativo en JavaScript para formatear miles con puntos y mantener la posición del cursor
  const handleAmountChange = (e) => {
    const inputEl = e.target;
    const rawVal = inputEl.value;
    const cursorPos = inputEl.selectionStart || 0;

    const digitsBeforeCursor = rawVal.slice(0, cursorPos).replace(/\D/g, '').length;
    const cleanDigits = rawVal.replace(/\D/g, '');
    const numericVal = cleanDigits ? parseInt(cleanDigits, 10) : 0;
    const formatted = cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    setLoanAmount(numericVal);
    setDisplayAmount(formatted);

    requestAnimationFrame(() => {
      if (!inputEl) return;
      let newPos = 0;
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          count++;
        }
        if (count === digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
      if (digitsBeforeCursor === 0) newPos = 0;
      inputEl.setSelectionRange(newPos, newPos);
    });
  };

  // Cargar catálogo de tipos de crédito
  useEffect(() => {
    const fetchCreditTypes = async () => {
      try {
        const res = await apiFetch('/simulator/credit-types');
        if (res && res.success && res.data && res.data.length > 0) {
          setCreditTypes(res.data);
        }
      } catch (err) {
        console.log('Usando catálogo local de tipos de crédito', err);
      }
    };
    fetchCreditTypes();
  }, []);

  const activeCreditType = creditTypes.find(ct => (ct.typeCode || ct.id) === Number(selectedTypeCode)) || creditTypes[0];

  // Cálculo local de respaldo
  const calculateLocalSimulation = (amount, months, selectedMethod) => {
    const annualInterestRate = activeCreditType?.annualInterestRate || 15.5;
    const teaDouble = annualInterestRate / 100;
    const monthlyRate = Math.pow(1.0 + teaDouble, 1.0 / 12.0) - 1.0;
    const desgravamenRate = 0.0006;

    const n = Math.max(1, Number(months));
    const principal = Number(amount);

    const schedule = [];
    let totalInterest = 0;
    let totalDesgravamen = 0;
    let totalPaid = 0;
    let initialPayment = 0;
    let finalPayment = 0;

    let remainingBalance = principal;

    if (Number(selectedMethod) === 1) {
      // Método Francés
      const factor = Math.pow(1 + monthlyRate, n);
      const r = (monthlyRate === 0 || factor <= 1)
        ? principal / n
        : principal * (monthlyRate * factor) / (factor - 1);
      const baseFixedPayment = Math.round(r * 100) / 100;

      for (let k = 1; k <= n; k++) {
        const initialBal = remainingBalance;
        const interestPaid = Math.round(initialBal * monthlyRate * 100) / 100;
        const desgravamenPaid = Math.round(initialBal * desgravamenRate * 100) / 100;
        let capitalPaid = (k === n) ? initialBal : Math.round((baseFixedPayment - interestPaid) * 100) / 100;
        if (capitalPaid > initialBal) capitalPaid = initialBal;

        remainingBalance = (k === n) ? 0 : Math.round((initialBal - capitalPaid) * 100) / 100;
        const totalPaymentRow = Math.round((capitalPaid + interestPaid + desgravamenPaid) * 100) / 100;

        if (k === 1) initialPayment = totalPaymentRow;
        if (k === n) finalPayment = totalPaymentRow;

        totalInterest += interestPaid;
        totalDesgravamen += desgravamenPaid;
        totalPaid += totalPaymentRow;

        schedule.push({
          month: k,
          initialBalance: initialBal,
          capitalPaid,
          interestPaid,
          desgravamen: desgravamenPaid,
          payment: totalPaymentRow,
          remainingBalance: remainingBalance < 0 ? 0 : remainingBalance
        });
      }
    } else {
      // Método Alemán
      const constantCapital = Math.round((principal / n) * 100) / 100;

      for (let k = 1; k <= n; k++) {
        const initialBal = remainingBalance;
        const interestPaid = Math.round(initialBal * monthlyRate * 100) / 100;
        const desgravamenPaid = Math.round(initialBal * desgravamenRate * 100) / 100;
        const capitalPaid = (k === n) ? initialBal : constantCapital;

        remainingBalance = (k === n) ? 0 : Math.round((initialBal - capitalPaid) * 100) / 100;
        const totalPaymentRow = Math.round((capitalPaid + interestPaid + desgravamenPaid) * 100) / 100;

        if (k === 1) initialPayment = totalPaymentRow;
        if (k === n) finalPayment = totalPaymentRow;

        totalInterest += interestPaid;
        totalDesgravamen += desgravamenPaid;
        totalPaid += totalPaymentRow;

        schedule.push({
          month: k,
          initialBalance: initialBal,
          capitalPaid,
          interestPaid,
          desgravamen: desgravamenPaid,
          payment: totalPaymentRow,
          remainingBalance: remainingBalance < 0 ? 0 : remainingBalance
        });
      }
    }

    return {
      creditTypeName: activeCreditType?.name || 'Crédito Consumo Ágil Banco',
      amortizationMethodName: Number(selectedMethod) === 1 ? 'Sistema Francés' : 'Sistema Alemán',
      periodicity: 'Mensual (Cuotas cada 30 días)',
      institutionType,
      amount: principal,
      termMonths: n,
      annualInterestRate,
      monthlyInterestRate: Math.round(monthlyRate * 10000) / 100,
      monthlyDesgravamenRate: 0.06,
      initialMonthlyPayment: Math.round(initialPayment * 100) / 100,
      finalMonthlyPayment: Math.round(finalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalDesgravamen: Math.round(totalDesgravamen * 100) / 100,
      totalAmountPaid: Math.round(totalPaid * 100) / 100,
      schedule
    };
  };

  const handleCalculate = async (methodToUse = method) => {
    setError('');
    const amountNum = Number(loanAmount);
    const monthsNum = Number(termMonths);

    if (!amountNum || amountNum < 50) {
      setError('El monto mínimo a solicitar es $50.00 USD.');
      return;
    }

    if (!monthsNum || monthsNum < 1 || monthsNum > 360) {
      setError(termUnit === 'años' ? 'El plazo debe estar entre 1 y 30 años.' : 'El plazo debe estar entre 1 y 360 meses.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/simulator/calculate', {
        method: 'POST',
        body: JSON.stringify({
          creditType: Number(selectedTypeCode),
          amount: amountNum,
          termMonths: monthsNum,
          method: Number(methodToUse),
          periodicity,
          institutionType
        })
      });

      if (res && res.success && res.data) {
        setSimulationResult(res.data);
      } else {
        setSimulationResult(calculateLocalSimulation(amountNum, monthsNum, methodToUse));
      }
    } catch {
      setSimulationResult(calculateLocalSimulation(amountNum, monthsNum, methodToUse));
    } finally {
      setLoading(false);
    }
  };

  // Calcular automáticamente al cargar o cambiar parámetros principales
  useEffect(() => {
    handleCalculate();
  }, [selectedTypeCode, method]);

  const handleExportPdf = () => {
    if (simulationResult) {
      generateCreditPdf(simulationResult, user?.username);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="grid-simulator" style={{ gridTemplateColumns: '340px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* PANEL IZQUIERDO: "Tu Solicitud" */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.2rem' }}>
            Tu Solicitud
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.3' }}>
            Ingresa los datos para calcular tu cronograma de pagos
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>
            {/* 1. Monto a Solicitar (USD) */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.9rem' }}>
                1. Monto a Solicitar (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '600', color: '#64748b' }}>$</span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontWeight: '700', fontSize: '1rem' }}
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="500"
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Monto mínimo sugerido: $50.00 USD
              </span>
            </div>

            {/* 2. Periodicidad de Pago */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.9rem' }}>
                2. Periodicidad de Pago
              </label>
              <select
                className="form-select"
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value)}
                style={{ fontSize: '0.88rem', fontWeight: '600' }}
              >
                <option value="Mensual (Cuotas cada 30 días)">Mensual (Cuotas cada 30 días)</option>
              </select>
            </div>

            {/* 3. Plazo (Meses / Años) */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ fontSize: '0.9rem', margin: 0 }}>
                  3. Plazo ({termUnit === 'años' ? 'Años' : 'Meses'})
                </label>
                <div style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  padding: '2px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('meses')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: termUnit === 'meses' ? '#ffffff' : 'transparent',
                      color: termUnit === 'meses' ? '#0f172a' : '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: termUnit === 'meses' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Meses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('años')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: termUnit === 'años' ? '#ffffff' : 'transparent',
                      color: termUnit === 'años' ? '#0f172a' : '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: termUnit === 'años' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Años
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📅</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', fontWeight: '700', fontSize: '1rem' }}
                  value={termValue}
                  onChange={(e) => handleTermValueChange(e.target.value)}
                  min="1"
                  max={termUnit === 'años' ? '30' : '360'}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {termUnit === 'años' ? 'Financiamiento hasta 30 años' : 'Financiamiento hasta 360 meses'}
              </span>
            </div>

            {/* 4. Sistema de Amortización */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.9rem' }}>
                4. Sistema de Amortización
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.25rem',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '0.4rem'
              }}>
                <button
                  type="button"
                  onClick={() => { setMethod(1); handleCalculate(1); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: method === 1 ? '#ffffff' : 'transparent',
                    color: method === 1 ? '#0f172a' : '#64748b',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: method === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Francés
                </button>

                <button
                  type="button"
                  onClick={() => { setMethod(2); handleCalculate(2); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: method === 2 ? '#ffffff' : 'transparent',
                    color: method === 2 ? '#0f172a' : '#64748b',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: method === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Alemán
                </button>
              </div>

              <span style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.25' }}>
                {method === 1
                  ? 'Cuota fija periódica (capital creciente + interés decreciente)'
                  : 'Cuota decreciente (capital constante + interés decreciente)'}
              </span>
            </div>

            {/* Tipo de Institución (Opcional) */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Tipo de Institución (Opcional)
              </label>
              <select
                className="form-select"
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
              >
                <option value="Banco">Banco</option>
              </select>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.85rem',
                background: '#0a2540',
                color: '#ffffff',
                fontWeight: '700',
                borderRadius: '8px',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              disabled={loading}
            >
              <FileText size={18} />
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </form>
        </div>

        {/* PANEL DERECHO: DETALLE Y COMPROBANTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Superior y Badges */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              {/* Badges Pill Row */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span style={{ background: '#0a2540', color: '#ffffff', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                  {institutionType}
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                  {activeCreditType?.category || 'Consumo Prioritario'}
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.65rem', borderRadius: '12px' }}>
                  {method === 1 ? 'Sistema Francés' : 'Sistema Alemán'}
                </span>
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {activeCreditType?.name || 'Crédito Consumo Ágil Banco'}
              </h1>

              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: '600' }}>
                Tasa Efectiva Anual: <strong style={{ color: '#0f172a' }}>{activeCreditType?.annualInterestRate || 15.5}%</strong> · Seguro Desgravamen: <strong style={{ color: '#0f172a' }}>0.06% mensual</strong>
              </p>
            </div>

            {/* Botón Descargar PDF verde */}
            <button
              onClick={handleExportPdf}
              className="btn"
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '0.7rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: '700',
                borderRadius: '8px'
              }}
              disabled={!simulationResult}
            >
              <Download size={16} /> Descargar PDF
            </button>
          </div>

          {/* Grid de 4 TARJETAS DE RESULTADOS (KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            
            {/* Card 1: CUOTA MENSUAL */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CUOTA MENSUAL
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0a2540', margin: '0.5rem 0 0.2rem' }}>
                ${simulationResult ? simulationResult.initialMonthlyPayment.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {method === 1 ? 'Cuota base fija' : 'Cuota inicial variable'}
              </span>
            </div>

            {/* Card 2: TOTAL INTERÉS */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TOTAL INTERÉS
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#d97706', margin: '0.5rem 0 0.2rem' }}>
                ${simulationResult ? simulationResult.totalInterest.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Costo financiero
              </span>
            </div>

            {/* Card 3: TOTAL DESGRAVAMEN */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TOTAL DESGRAVAMEN
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2563eb', margin: '0.5rem 0 0.2rem' }}>
                ${simulationResult ? simulationResult.totalDesgravamen.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Sobre saldo deudor
              </span>
            </div>

            {/* Card 4: TOTAL A PAGAR */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TOTAL A PAGAR
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0.5rem 0 0.2rem' }}>
                ${simulationResult ? simulationResult.totalAmountPaid.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {simulationResult ? simulationResult.termMonths : termMonths} cuotas
              </span>
            </div>

          </div>

          {/* TABLA DE AMORTIZACIÓN OFICIAL */}
          {simulationResult && (
            <AmortizationTable simulation={simulationResult} userName={user?.username} />
          )}

        </div>
      </div>
    </div>
  );
};
