// ====================================================================================================
// PROYECTO UNIVERSITARIO: SIMULADOR DE PRÉSTAMOS / CRÉDITOS BANCARIOS (SHARED BUILDING BLOCKS)
// INTEGRANTE / EXPOSITOR: Estudiante de Ingeniería de Software / Sistemas
// MATERIA: Arquitectura de Microservicios / Modelado de Datos DTO (Data Transfer Objects)
// ====================================================================================================
// ARCHIVO: SimulatorDtos.cs
// PROPÓSITO: Librería compartida (Shared.Common) que define los DTOs (Data Transfer Objects)
//            utilizados para la serialización y deserialización de mensajes JSON entre el Frontend,
//            el ApiGateway y los Microservicios.
// ====================================================================================================

using System.ComponentModel.DataAnnotations;
using Shared.Common.Enums;

namespace Shared.Common.Dtos
{
    /// <summary>
    /// DTO que representa una opción del catálogo comercial de líneas de crédito.
    /// Contiene los rangos permitidos (Monto mín/máx, Plazo mín/máx) y la Tasa Efectiva Anual (TEA).
    /// </summary>
    public class CreditTypeOptionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal AnnualInterestRate { get; set; }
        public int MinMonths { get; set; }
        public int MaxMonths { get; set; }
        public decimal MinAmount { get; set; }
        public decimal MaxAmount { get; set; }
    }

    /// <summary>
    /// DTO enviado por el usuario desde el formulario React para solicitar el cálculo de la simulación.
    /// Incluye DataAnnotations para validación automática en el servidor ASP.NET Core.
    /// </summary>
    public class CalculateCreditRequestDto
    {
        [Required(ErrorMessage = "El tipo de crédito es obligatorio.")]
        public CreditTypeEnum CreditType { get; set; }

        [Range(50, 1000000, ErrorMessage = "El monto debe estar entre $50 y $1,000,000.")]
        public decimal Amount { get; set; }

        [Range(1, 360, ErrorMessage = "El plazo debe estar entre 1 y 360 meses.")]
        public int TermMonths { get; set; }

        [Required(ErrorMessage = "El método de amortización es obligatorio.")]
        public AmortizationMethodEnum Method { get; set; }

        public string Periodicity { get; set; } = "Mensual";
        public string InstitutionType { get; set; } = "Banco";
    }

    /// <summary>
    /// DTO que representa una celda / fila individual dentro del cronograma de amortización mensual.
    /// Contiene los 7 rubros financieros clave de la cuota k.
    /// </summary>
    public class AmortizationRowDto
    {
        public int Month { get; set; }             // Número de cuota k (1..n)
        public decimal InitialBalance { get; set; }  // Saldo Inicial Deudor
        public decimal CapitalPaid { get; set; }     // Abono a Capital
        public decimal InterestPaid { get; set; }    // Interés del mes
        public decimal Desgravamen { get; set; }      // Seguro de Desgravamen
        public decimal Payment { get; set; }         // Cuota Total a pagar en ventanilla
        public decimal RemainingBalance { get; set; } // Saldo Final Remanente
    }

    /// <summary>
    /// DTO principal de respuesta emitido por el microservicio con todos los resultados consolidados de la simulación.
    /// </summary>
    public class CalculateCreditResponseDto
    {
        public string CreditTypeName { get; set; } = string.Empty;
        public string AmortizationMethodName { get; set; } = string.Empty;
        public string Periodicity { get; set; } = "Mensual (Cuotas cada 30 días)";
        public string InstitutionType { get; set; } = "Banco";
        public decimal Amount { get; set; }
        public int TermMonths { get; set; }
        public decimal AnnualInterestRate { get; set; }
        public decimal MonthlyInterestRate { get; set; }
        public decimal MonthlyDesgravamenRate { get; set; } = 0.06m; // 0.06% mensual
        public decimal InitialMonthlyPayment { get; set; }
        public decimal FinalMonthlyPayment { get; set; }
        public decimal TotalInterest { get; set; }
        public decimal TotalDesgravamen { get; set; }
        public decimal TotalAmountPaid { get; set; }
        public List<AmortizationRowDto> Schedule { get; set; } = new();
    }
}
