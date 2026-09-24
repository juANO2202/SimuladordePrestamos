using CreditSimulator.Api.Data;
using CreditSimulator.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Shared.Common.Dtos;
using Shared.Common.Models;

namespace CreditSimulator.Api.Services
{
    public interface ICreditSimulatorService
    {
        Task<ApiResponse<List<CreditTypeOptionDto>>> GetCreditTypesAsync();
        Task<ApiResponse<CalculateCreditResponseDto>> CalculateCreditAsync(CalculateCreditRequestDto request, int? userId = null, string? username = null);
        Task<ApiResponse<List<SimulationRecord>>> GetHistoryAsync(int userId);
    }

    public class CreditSimulatorService : ICreditSimulatorService
    {
        private readonly SimulatorDbContext _dbContext;
        private readonly IAmortizationEngine _amortizationEngine;

        public CreditSimulatorService(SimulatorDbContext dbContext, IAmortizationEngine amortizationEngine)
        {
            _dbContext = dbContext;
            _amortizationEngine = amortizationEngine;
        }

        public async Task<ApiResponse<List<CreditTypeOptionDto>>> GetCreditTypesAsync()
        {
            var types = await _dbContext.CreditTypes.ToListAsync();
            var dtos = types.Select(t => new CreditTypeOptionDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                AnnualInterestRate = t.AnnualInterestRate,
                MinMonths = t.MinMonths,
                MaxMonths = t.MaxMonths,
                MinAmount = t.MinAmount,
                MaxAmount = t.MaxAmount
            }).ToList();

            return ApiResponse<List<CreditTypeOptionDto>>.Ok(dtos);
        }

        public async Task<ApiResponse<CalculateCreditResponseDto>> CalculateCreditAsync(CalculateCreditRequestDto request, int? userId = null, string? username = null)
        {
            var creditType = await _dbContext.CreditTypes.FirstOrDefaultAsync(ct => ct.TypeCode == request.CreditType);
            if (creditType == null)
            {
                return ApiResponse<CalculateCreditResponseDto>.Fail("Tipo de crédito no válido.");
            }

            if (request.Amount < creditType.MinAmount || request.Amount > creditType.MaxAmount)
            {
                return ApiResponse<CalculateCreditResponseDto>.Fail($"El monto para {creditType.Name} debe estar entre ${creditType.MinAmount:N2} y ${creditType.MaxAmount:N2}.");
            }

            if (request.TermMonths < creditType.MinMonths || request.TermMonths > creditType.MaxMonths)
            {
                return ApiResponse<CalculateCreditResponseDto>.Fail($"El plazo para {creditType.Name} debe estar entre {creditType.MinMonths} y {creditType.MaxMonths} meses.");
            }

            var result = _amortizationEngine.Calculate(request, creditType.Name, creditType.AnnualInterestRate);

            // Si el usuario está autenticado, guardar en el historial
            if (userId.HasValue && userId.Value > 0)
            {
                var record = new SimulationRecord
                {
                    UserId = userId.Value,
                    Username = username ?? "Usuario",
                    CreditTypeCode = request.CreditType,
                    Method = request.Method,
                    Amount = request.Amount,
                    TermMonths = request.TermMonths,
                    AnnualInterestRate = creditType.AnnualInterestRate,
                    InitialMonthlyPayment = result.InitialMonthlyPayment,
                    TotalInterest = result.TotalInterest,
                    TotalAmountPaid = result.TotalAmountPaid,
                    SimulatedAt = DateTime.UtcNow
                };

                _dbContext.SimulationRecords.Add(record);
                await _dbContext.SaveChangesAsync();
            }

            return ApiResponse<CalculateCreditResponseDto>.Ok(result, "Simulación calculada exitosamente.");
        }

        public async Task<ApiResponse<List<SimulationRecord>>> GetHistoryAsync(int userId)
        {
            var history = await _dbContext.SimulationRecords
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.SimulatedAt)
                .Take(20)
                .ToListAsync();

            return ApiResponse<List<SimulationRecord>>.Ok(history);
        }
    }
}
