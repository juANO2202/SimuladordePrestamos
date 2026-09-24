using System.ComponentModel.DataAnnotations;
using Shared.Common.Enums;

namespace CreditSimulator.Api.Entities
{
    public class CreditType
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public CreditTypeEnum TypeCode { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public decimal AnnualInterestRate { get; set; } // Tasa de interés anual en porcentaje (ej: 15.5)

        public int MinMonths { get; set; } = 3;
        public int MaxMonths { get; set; } = 360;

        public decimal MinAmount { get; set; } = 500;
        public decimal MaxAmount { get; set; } = 500000;
    }
}
