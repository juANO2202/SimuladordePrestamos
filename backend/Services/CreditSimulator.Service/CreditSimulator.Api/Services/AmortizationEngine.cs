using Shared.Common.Dtos;
using Shared.Common.Enums;

namespace CreditSimulator.Api.Services
{
    public interface IAmortizationEngine
    {
        CalculateCreditResponseDto Calculate(CalculateCreditRequestDto request, string creditTypeName, decimal annualInterestRate);
    }

    public class AmortizationEngine : IAmortizationEngine
    {
        public CalculateCreditResponseDto Calculate(CalculateCreditRequestDto request, string creditTypeName, decimal annualInterestRate)
        {
            double teaDouble = (double)(annualInterestRate / 100m);
            double monthlyRateDouble = Math.Pow(1.0 + teaDouble, 1.0 / 12.0) - 1.0;
            decimal monthlyRate = (decimal)monthlyRateDouble;

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

            if (request.Method == AmortizationMethodEnum.Frances)
            {
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
                    decimal interestPaid = Math.Round(initialBal * monthlyRate, 2);
                    decimal desgravamenPaid = Math.Round(initialBal * desgravamenRate, 2);
                    decimal capitalPaid;

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
            else
            {
                decimal constantCapital = Math.Round(principal / n, 2);

                for (int k = 1; k <= n; k++)
                {
                    decimal initialBal = remainingBalance;
                    decimal interestPaid = Math.Round(initialBal * monthlyRate, 2);
                    decimal desgravamenPaid = Math.Round(initialBal * desgravamenRate, 2);
                    decimal capitalPaid;

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
