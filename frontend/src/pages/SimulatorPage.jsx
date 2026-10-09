import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AmortizationTable } from '../components/AmortizationTable';
import { generateCreditPdf } from '../utils/pdfGenerator';
import { formatMoney } from '../utils/format';
import { Download, Calculator, AlertCircle } from 'lucide-react';

export const SimulatorPage = () => {
  const { user } = useAuth();
  const amountInputRef = useRef(null);

  // Catálogo local de respaldo (mismos valores que el seed del backend)
  const [creditTypes, setCreditTypes] = useState([
    { id: 1, typeCode: 1, name: 'Crédito de Consumo', annualInterestRate: 15.5, minMonths: 6, maxMonths: 60, minAmount: 500, maxAmount: 40000 },
    { id: 2, typeCode: 2, name: 'Crédito Hipotecario', annualInterestRate: 9.5, minMonths: 12, maxMonths: 300, minAmount: 10000, maxAmount: 500000 },
    { id: 3, typeCode: 3, name: 'Crédito Educativo', annualInterestRate: 8.0, minMonths: 6, maxMonths: 120, minAmount: 1000, maxAmount: 80000 }
  ]);

  const [selectedTypeCode, setSelectedTypeCode] = useState(1);
  const [loanAmount, setLoanAmount] = useState(500);
  const [displayAmount, setDisplayAmount] = useState('500');
  const [periodicity, setPeriodicity] = useState('Mensual (Cuotas cada 30 días)');
  const [termUnit, setTermUnit] = useState('meses');
  const [termValue, setTermValue] = useState(12);
  const [termMonths, setTermMonths] = useState(12);
  const [method, setMethod] = useState(1);
  const [institutionType, setInstitutionType] = useState('Banco');

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  const categoryByCode = { 1: 'Consumo', 2: 'Hipotecario', 3: 'Educativo' };

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

  // save=true solo cuando el usuario presiona "Calcular"; los recálculos automáticos no se guardan en el historial
  const handleCalculate = async (save = false) => {
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
          method: Number(method),
          save,
          periodicity,
          institutionType
        })
      });

      if (res && res.success && res.data) {
        setSimulationResult(res.data);
      } else if (res && res.networkError) {
        // Sin conexión con el backend: calcular localmente (no se guarda en el historial)
        setSimulationResult(calculateLocalSimulation(amountNum, monthsNum, method));
      } else {
        // Error de validación del servidor (monto/plazo fuera de rango, etc.)
        setError(res?.message || 'No se pudo calcular la simulación.');
      }
    } catch {
      setSimulationResult(calculateLocalSimulation(amountNum, monthsNum, method));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate(false);
  }, [selectedTypeCode, method]);

  const handleExportPdf = () => {
    if (simulationResult) {
      generateCreditPdf(simulationResult, user?.username);
    }
  };

  const typeCode = activeCreditType?.typeCode || activeCreditType?.id;
  const result = simulationResult;
  const totalForSplit = result ? result.amount + result.totalInterest + result.totalDesgravamen : 0;
  const pct = (value) => (totalForSplit > 0 ? (value / totalForSplit) * 100 : 0);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{categoryByCode[typeCode] || 'Crédito'} · {institutionType}</p>
        <h1 className="display">{activeCreditType?.name || 'Simulador de crédito'}</h1>
        <p className="subhead">
          Tasa efectiva anual del <strong className="num">{activeCreditType?.annualInterestRate}%</strong> y seguro de
          desgravamen del <strong className="num">0,06%</strong> mensual sobre saldo.
        </p>
      </header>

      <div className="simulator-layout">
        <aside className="card simulator-form">
          <h2 className="title" style={{ marginBottom: '0.25rem' }}>Tu solicitud</h2>
          <p className="caption" style={{ marginBottom: '1.5rem' }}>
            El resultado se actualiza al cambiar el tipo de crédito o el sistema.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleCalculate(true); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="credit-type">Tipo de crédito</label>
              <select
                id="credit-type"
                className="form-select"
                value={selectedTypeCode}
                onChange={(e) => setSelectedTypeCode(Number(e.target.value))}
              >
                {creditTypes.map((ct) => (
                  <option key={ct.id} value={ct.typeCode || ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount">Monto a solicitar (USD)</label>
              <div className="field">
                <span className="field-prefix">$</span>
                <input
                  id="amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  className="form-input amount-input num"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="500"
                />
              </div>
              <span className="field-hint num">
                Rango permitido: ${activeCreditType?.minAmount?.toLocaleString('es-EC')} – ${activeCreditType?.maxAmount?.toLocaleString('es-EC')}
              </span>
            </div>

            <div className="form-group">
              <div className="form-row">
                <label className="form-label" htmlFor="term">Plazo</label>
                <div className="segmented sm" role="group" aria-label="Unidad del plazo" style={{ '--index': termUnit === 'meses' ? 0 : 1 }}>
                  <button type="button" aria-pressed={termUnit === 'meses'} onClick={() => handleUnitChange('meses')}>Meses</button>
                  <button type="button" aria-pressed={termUnit === 'años'} onClick={() => handleUnitChange('años')}>Años</button>
                </div>
              </div>
              <input
                id="term"
                type="number"
                className="form-input num"
                value={termValue}
                onChange={(e) => handleTermValueChange(e.target.value)}
                min="1"
                max={termUnit === 'años' ? '30' : '360'}
              />
              <span className="field-hint num">
                Plazo permitido: {activeCreditType?.minMonths} a {activeCreditType?.maxMonths} meses
              </span>
            </div>

            <div className="form-group">
              <span className="form-label">Sistema de amortización</span>
              <div className="segmented block" role="group" aria-label="Sistema de amortización" style={{ '--index': method === 1 ? 0 : 1 }}>
                <button type="button" aria-pressed={method === 1} onClick={() => setMethod(1)}>Francés</button>
                <button type="button" aria-pressed={method === 2} onClick={() => setMethod(2)}>Alemán</button>
              </div>
              <span className="field-hint">
                {method === 1
                  ? 'Cuota fija: pagas lo mismo cada mes.'
                  : 'Cuota decreciente: pagas más al inicio y menos al final.'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="periodicity">Periodicidad</label>
              <select
                id="periodicity"
                className="form-select"
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value)}
              >
                <option value="Mensual (Cuotas cada 30 días)">Mensual (cuotas cada 30 días)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="institution">Tipo de institución</label>
              <select
                id="institution"
                className="form-select"
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
              >
                <option value="Banco">Banco</option>
              </select>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={16} />
                <div>{error}</div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              <Calculator size={18} />
              {loading ? 'Calculando…' : 'Calcular'}
            </button>
          </form>
        </aside>

        <section className="results" aria-live="polite">
          <div className="hero">
            <div className="chips">
              <span className="chip accent">{method === 1 ? 'Sistema francés' : 'Sistema alemán'}</span>
              <span className="chip">{result ? result.termMonths : termMonths} cuotas</span>
              <span className="chip">{categoryByCode[typeCode] || 'Crédito'}</span>
            </div>
            <button onClick={handleExportPdf} className="btn btn-secondary" disabled={!result}>
              <Download size={16} /> Descargar PDF
            </button>
          </div>

          <div className="stats">
            <div className="stat featured">
              <span className="eyebrow">Cuota mensual</span>
              <div className="stat-value">{result ? formatMoney(result.initialMonthlyPayment) : '$0,00'}</div>
              <span className="caption">{method === 1 ? 'Cuota base fija' : 'Primera cuota (decrece)'}</span>
            </div>
            <div className="stat">
              <span className="eyebrow">Total interés</span>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{result ? formatMoney(result.totalInterest) : '$0,00'}</div>
              <span className="caption">Costo financiero</span>
            </div>
            <div className="stat">
              <span className="eyebrow">Desgravamen</span>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{result ? formatMoney(result.totalDesgravamen) : '$0,00'}</div>
              <span className="caption">Seguro sobre saldo</span>
            </div>
            <div className="stat">
              <span className="eyebrow">Total a pagar</span>
              <div className="stat-value">{result ? formatMoney(result.totalAmountPaid) : '$0,00'}</div>
              <span className="caption">{result ? result.termMonths : termMonths} cuotas</span>
            </div>
          </div>

          {result && (
            <div className="card card-flat">
              <h3 className="headline">¿En qué se va tu dinero?</h3>
              <div className="split-bar" role="img" aria-label="Distribución entre capital, interés y desgravamen">
                <span className="split-capital" style={{ width: `${pct(result.amount)}%` }} />
                <span className="split-interest" style={{ width: `${pct(result.totalInterest)}%` }} />
                <span className="split-insurance" style={{ width: `${pct(result.totalDesgravamen)}%` }} />
              </div>
              <div className="legend num">
                <span><i className="split-capital" />Capital {formatMoney(result.amount)}</span>
                <span><i className="split-interest" />Interés {formatMoney(result.totalInterest)}</span>
                <span><i className="split-insurance" />Desgravamen {formatMoney(result.totalDesgravamen)}</span>
              </div>
            </div>
          )}

          {result && <AmortizationTable simulation={result} userName={user?.username} />}
        </section>
      </div>
    </div>
  );
};
