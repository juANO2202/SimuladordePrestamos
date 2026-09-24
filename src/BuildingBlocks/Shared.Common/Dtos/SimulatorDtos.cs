using System.ComponentModel.DataAnnotations;
using Shared.Common.Enums;

namespace Shared.Common.Dtos
{
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

    public class AmortizationRowDto
    {
        public int Month { get; set; }
        public decimal InitialBalance { get; set; }  // Saldo Inicial
        public decimal CapitalPaid { get; set; }     // Capital
        public decimal InterestPaid { get; set; }    // Interés
        public decimal Desgravamen { get; set; }      // Desgravamen (Seguro)
        public decimal Payment { get; set; }         // Cuota Total
        public decimal RemainingBalance { get; set; } // Saldo Final
    }

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
