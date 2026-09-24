// ====================================================================================================
// PROYECTO UNIVERSITARIO: SIMULADOR DE PRÉSTAMOS / CRÉDITOS BANCARIOS (SISTEMAS FINANCIEROS)
// INTEGRANTE / EXPOSITOR: Estudiante de Ingeniería de Software / Sistemas
// MATERIA: Metodologías Ágiles de Desarrollo / Ingeniería de Software / Sistemas Financieros
// ====================================================================================================
// ARCHIVO: AmortizationEngine.cs
// PROPÓSITO: Motor principal de cálculo financiero del backend (.NET 8).
//            Implementa la lógica matemática de amortización crediticia, conversión de tasa TEA a TEM,
//            cálculo de seguro de desgravamen y generación del cronograma de cuotas (Sistemas Francés y Alemán).
// ====================================================================================================

using Shared.Common.Dtos;
using Shared.Common.Enums;

namespace CreditSimulator.Api.Services
{
    /// <summary>
    /// Interfaz del motor financiero para aplicar el patrón de Inyección de Dependencias (DI) en .NET Core.
    /// Esto permite descolar la lógica de negocio de los controladores e implementar pruebas unitarias.
    /// </summary>
    public interface IAmortizationEngine
    {
        CalculateCreditResponseDto Calculate(CalculateCreditRequestDto request, string creditTypeName, decimal annualInterestRate);
    }

    /// <summary>
    /// Clase concreta que implementa el motor de amortización crediticia.
    /// Contiene la matemática financiera utilizada por bancos y cooperativas del sistema financiero.
    /// </summary>
    public class AmortizationEngine : IAmortizationEngine
    {
        /// <summary>
        /// Método principal que calcula la tabla de amortización completa y los kpis consolidados.
        /// </summary>
        /// <param name="request">DTO con los parámetros solicitados por el usuario (monto, plazo en meses, sistema de amortización).</param>
        /// <param name="creditTypeName">Nombre comercial del tipo de crédito seleccionado.</param>
        /// <param name="annualInterestRate">Tasa Efectiva Anual (TEA) configurada para la línea crediticia.</param>
        /// <returns>DTO estructurado con la tabla de pagos celda a celda y los totales (interés, desgravamen, monto pagado).</returns>
        public CalculateCreditResponseDto Calculate(CalculateCreditRequestDto request, string creditTypeName, decimal annualInterestRate)
        {
            // ------------------------------------------------------------------------------------------------
            // PASO 1: CONVERSIÓN DE TASA EFECTIVA ANUAL (TEA) A TASA EFECTIVA MENSUAL (TEM)
            // ------------------------------------------------------------------------------------------------
            // En el sistema financiero (ej: Ecuador / LATAM), la tasa nominal anual no se divide directamente entre 12,
            // sino que se aplica la fórmula de equivalencia financiera de Tasas Efectivas:
            // Formula: i_mensual = (1 + TEA)^(1/12) - 1
            // Ejemplo: Para una TEA de 15.5% (0.155) -> (1 + 0.155)^(1/12) - 1 = 0.01207... (1.207% mensual).
            // ------------------------------------------------------------------------------------------------
            double teaDouble = (double)(annualInterestRate / 100m);
            double monthlyRateDouble = Math.Pow(1.0 + teaDouble, 1.0 / 12.0) - 1.0;
            decimal monthlyRate = (decimal)monthlyRateDouble;

            // ------------------------------------------------------------------------------------------------
            // PASO 2: SEGURO DE DESGRAVAMEN Y VARIABLES INICIALES
            // ------------------------------------------------------------------------------------------------
            // Tasa fija de desgravamen: 0.06% mensual (0.0006) calculada sobre el Saldo Inicial Deudor de cada período.
            // Protege al usuario cancelando la deuda remanente en caso de fallecimiento o incapacidad.
            // ------------------------------------------------------------------------------------------------
            decimal desgravamenRate = 0.0006m; 
            int n = request.TermMonths;
            decimal principal = request.Amount;

            var schedule = new List<AmortizationRowDto>();
            decimal totalInterest = 0m;
            decimal totalDesgravamen = 0m;
            decimal totalPaid = 0m;
            decimal initialPayment = 0m;
            decimal finalPayment = 0m;

            decimal remainingBalance = principal;

            // ------------------------------------------------------------------------------------------------
            // PASO 3: SELECCIÓN DEL SISTEMA DE AMORTIZACIÓN (FRANCÉS VS ALEMÁN)
            // ------------------------------------------------------------------------------------------------
            if (request.Method == AmortizationMethodEnum.Frances)
            {
                // ============================================================================================
                // SISTEMA FRANCÉS (MÉTODO DE CUOTA CONSTATNE O ANUALIDAD VENCIDA)
                // ============================================================================================
                // Característica: La cuota base (Capital + Interés) se mantiene constante mes a mes.
                // - En las primeras cuotas se paga mayor proporción de Interés y menor Capital.
                // - A medida que el saldo cae, la cuota de capital aumenta.
                // Fórmula de la Cuota Base Fija R:
                // R = P * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
                // donde P = Principal (Monto), i = Tasa Efectiva Mensual, n = Número de Meses.
                // ============================================================================================
                double iDouble = monthlyRateDouble;
                double pDouble = (double)principal;
                double rDouble;

                if (iDouble == 0)
                {
                    rDouble = pDouble / n;
                }
                else
                {
                    rDouble = pDouble * (iDouble * Math.Pow(1 + iDouble, n)) / (Math.Pow(1 + iDouble, n) - 1);
                }

                decimal baseFixedMonthlyPayment = Math.Round((decimal)rDouble, 2);

                for (int k = 1; k <= n; k++)
                {
                    decimal initialBal = remainingBalance;
                    
                    // Interés del mes = Saldo Inicial * Tasa Mensual
                    decimal interestPaid = Math.Round(initialBal * monthlyRate, 2);
                    
                    // Desgravamen del mes = Saldo Inicial * Tasa Desgravamen
                    decimal desgravamenPaid = Math.Round(initialBal * desgravamenRate, 2);
                    
                    decimal capitalPaid;

                    // Ajuste de precisión bancaria en la última cuota (k == n):
                    // Para evitar descuadres por centavos generados por redondeos intermedios,
                    // en la última cuota el abonado a capital es exactamente igual al saldo deudor inicial restante.
                    if (k == n)
                    {
                        capitalPaid = initialBal;
                        remainingBalance = 0m;
                    }
                    else
                    {
                        capitalPaid = baseFixedMonthlyPayment - interestPaid;
                        if (capitalPaid > initialBal) capitalPaid = initialBal;
                        remainingBalance = initialBal - capitalPaid;
                    }

                    // Cuota Total a pagar en la caja del banco = Capital + Interés + Seguro Desgravamen
                    decimal totalPaymentRow = capitalPaid + interestPaid + desgravamenPaid;

                    if (k == 1) initialPayment = totalPaymentRow;
                    if (k == n) finalPayment = totalPaymentRow;

                    totalInterest += interestPaid;
                    totalDesgravamen += desgravamenPaid;
                    totalPaid += totalPaymentRow;

                    schedule.Add(new AmortizationRowDto
                    {
                        Month = k,
                        InitialBalance = initialBal,
                        CapitalPaid = capitalPaid,
                        InterestPaid = interestPaid,
                        Desgravamen = desgravamenPaid,
                        Payment = totalPaymentRow,
                        RemainingBalance = remainingBalance < 0 ? 0m : remainingBalance
                    });
                }
            }
            else // AmortizationMethodEnum.Aleman
            {
                // ============================================================================================
                // SISTEMA ALEMÁN (MÉTODO DE CAPITAL CONSTANTE O AMORTIZACIÓN GRADUAL DECRECIENTE)
                // ============================================================================================
                // Característica: El abono a capital es idéntico todos los meses (C = P / n).
                // - La cuota total a pagar es decreciente (inicia alta y va bajando cada mes),
                //   debido a que los intereses sobre el saldo deudor van reduciéndose.
                // ============================================================================================
                decimal constantCapital = Math.Round(principal / n, 2);

                for (int k = 1; k <= n; k++)
                {
                    decimal initialBal = remainingBalance;
                    decimal interestPaid = Math.Round(initialBal * monthlyRate, 2);
                    decimal desgravamenPaid = Math.Round(initialBal * desgravamenRate, 2);
                    decimal capitalPaid;

                    // Ajuste de precisión bancaria en la última cuota para liquidar a cero el saldo
                    if (k == n)
                    {
                        capitalPaid = initialBal;
                        remainingBalance = 0m;
                    }
                    else
                    {
                        capitalPaid = constantCapital;
                        remainingBalance = initialBal - capitalPaid;
                    }

                    decimal totalPaymentRow = capitalPaid + interestPaid + desgravamenPaid;

                    if (k == 1) initialPayment = totalPaymentRow;
                    if (k == n) finalPayment = totalPaymentRow;

                    totalInterest += interestPaid;
                    totalDesgravamen += desgravamenPaid;
                    totalPaid += totalPaymentRow;

                    schedule.Add(new AmortizationRowDto
                    {
                        Month = k,
                        InitialBalance = initialBal,
                        CapitalPaid = capitalPaid,
                        InterestPaid = interestPaid,
                        Desgravamen = desgravamenPaid,
                        Payment = totalPaymentRow,
                        RemainingBalance = remainingBalance < 0 ? 0m : remainingBalance
                    });
                }
            }

            // ------------------------------------------------------------------------------------------------
            // PASO 4: CONSTRUCCIÓN DEL DTO DE RESPUESTA CONSOLIDADO
            // ------------------------------------------------------------------------------------------------
            return new CalculateCreditResponseDto
            {
                CreditTypeName = creditTypeName,
                AmortizationMethodName = request.Method == AmortizationMethodEnum.Frances ? "Sistema Francés" : "Sistema Alemán",
                Periodicity = string.IsNullOrWhiteSpace(request.Periodicity) ? "Mensual (Cuotas cada 30 días)" : request.Periodicity,
                InstitutionType = string.IsNullOrWhiteSpace(request.InstitutionType) ? "Banco" : request.InstitutionType,
                Amount = principal,
                TermMonths = n,
                AnnualInterestRate = annualInterestRate,
                MonthlyInterestRate = Math.Round(monthlyRate * 100m, 4),
                MonthlyDesgravamenRate = 0.06m,
                InitialMonthlyPayment = Math.Round(initialPayment, 2),
                FinalMonthlyPayment = Math.Round(finalPayment, 2),
                TotalInterest = Math.Round(totalInterest, 2),
                TotalDesgravamen = Math.Round(totalDesgravamen, 2),
                TotalAmountPaid = Math.Round(totalPaid, 2),
                Schedule = schedule
            };
        }
    }
}
