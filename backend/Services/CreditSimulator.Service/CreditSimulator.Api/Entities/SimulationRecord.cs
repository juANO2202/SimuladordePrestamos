using System.ComponentModel.DataAnnotations;
using Shared.Common.Enums;

namespace CreditSimulator.Api.Entities
{
    public class SimulationRecord
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public string Username { get; set; } = string.Empty;

        public CreditTypeEnum CreditTypeCode { get; set; }

        public AmortizationMethodEnum Method { get; set; }

        public decimal Amount { get; set; }

        public int TermMonths { get; set; }

        public decimal AnnualInterestRate { get; set; }

        public decimal InitialMonthlyPayment { get; set; }

        public decimal TotalInterest { get; set; }

        public decimal TotalAmountPaid { get; set; }

        public DateTime SimulatedAt { get; set; } = DateTime.UtcNow;
    }
}
