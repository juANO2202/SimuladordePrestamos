using CreditSimulator.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Shared.Common.Enums;

namespace CreditSimulator.Api.Data
{
    public class SimulatorDbContext : DbContext
    {
        public SimulatorDbContext(DbContextOptions<SimulatorDbContext> options) : base(options)
        {
        }

        public DbSet<CreditType> CreditTypes { get; set; } = null!;
        public DbSet<SimulationRecord> SimulationRecords { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CreditType>(entity =>
            {
                entity.Property(c => c.AnnualInterestRate).HasColumnType("decimal(18,2)");
                entity.Property(c => c.MinAmount).HasColumnType("decimal(18,2)");
                entity.Property(c => c.MaxAmount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<SimulationRecord>(entity =>
            {
                entity.Property(s => s.Amount).HasColumnType("decimal(18,2)");
                entity.Property(s => s.AnnualInterestRate).HasColumnType("decimal(18,2)");
                entity.Property(s => s.InitialMonthlyPayment).HasColumnType("decimal(18,2)");
                entity.Property(s => s.TotalInterest).HasColumnType("decimal(18,2)");
                entity.Property(s => s.TotalAmountPaid).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<CreditType>().HasData(
                new CreditType
                {
                    Id = 1,
                    TypeCode = CreditTypeEnum.Consumo,
                    Name = "Crédito de Consumo",
                    Description = "Préstamo de libre disponibilidad para viajes, vehículos, tecnología o consolidación de deudas.",
                    AnnualInterestRate = 15.5m,
                    MinMonths = 6,
                    MaxMonths = 60,
                    MinAmount = 500m,
                    MaxAmount = 40000m
                },
                new CreditType
                {
                    Id = 2,
                    TypeCode = CreditTypeEnum.Hipotecario,
                    Name = "Crédito Hipotecario",
                    Description = "Financiamiento de vivienda nueva, usada, construcción o remodelación con tasa preferencial.",
                    AnnualInterestRate = 9.5m,
                    MinMonths = 12,
                    MaxMonths = 300,
                    MinAmount = 10000m,
                    MaxAmount = 500000m
                },
                new CreditType
                {
                    Id = 3,
                    TypeCode = CreditTypeEnum.Educativo,
                    Name = "Crédito Educativo",
                    Description = "Financia estudios de pregrado, posgrado, maestrías y diplomados dentro y fuera del país.",
                    AnnualInterestRate = 8.0m,
                    MinMonths = 6,
                    MaxMonths = 120,
                    MinAmount = 1000m,
                    MaxAmount = 80000m
                }
            );
        }
    }
}
