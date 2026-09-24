-- ====================================================================================================
-- PROYECTO UNIVERSITARIO: SIMULADOR DE PRÉSTAMOS / CRÉDITOS BANCARIOS (BASE DE DATOS)
// ARCHIVO: init_PrestamosDb.sql
// PROPÓSITO: Script DDL/DML para la creación e inicialización completa de la Base de Datos 'PrestamosDb'
//            en SQL Server Express (JUAN\SQLEXPRESS / localhost\SQLEXPRESS).
// ====================================================================================================

-- 1. CREACIÓN DE LA BASE DE DATOS
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PrestamosDb')
BEGIN
    CREATE DATABASE PrestamosDb;
END
GO

USE PrestamosDb;
GO

-- 2. TABLA DE CONTROL DE MIGRACIONES ENTITY FRAMEWORK CORE
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.__EFMigrationsHistory (
        MigrationId NVARCHAR(150) NOT NULL PRIMARY KEY,
        ProductVersion NVARCHAR(32) NOT NULL
    );
END
GO

-- 3. TABLA DE USUARIOS DE LA APLICACIÓN (dbo.Users)
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4. TABLA DE CATÁLOGO COMERCIAL DE LÍNEAS DE CRÉDITO (dbo.CreditTypes)
IF OBJECT_ID(N'dbo.CreditTypes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CreditTypes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TypeCode INT NOT NULL UNIQUE,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(255) NULL,
        AnnualInterestRate DECIMAL(5,2) NOT NULL, -- Tasa Efectiva Anual (TEA)
        MinMonths INT NOT NULL,
        MaxMonths INT NOT NULL,
        MinAmount DECIMAL(18,2) NOT NULL,
        MaxAmount DECIMAL(18,2) NOT NULL
    );
END
GO

-- 5. TABLA DE HISTORIAL DE SIMULACIONES PERSISTIDAS (dbo.SimulationRecords)
IF OBJECT_ID(N'dbo.SimulationRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SimulationRecords (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CreditTypeCode INT NOT NULL,
        CreditTypeName NVARCHAR(100) NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        TermMonths INT NOT NULL,
        Method INT NOT NULL, -- 1 = Francés, 2 = Alemán
        MethodName NVARCHAR(50) NOT NULL,
        AnnualInterestRate DECIMAL(5,2) NOT NULL,
        InitialMonthlyPayment DECIMAL(18,2) NOT NULL,
        FinalMonthlyPayment DECIMAL(18,2) NOT NULL,
        TotalInterest DECIMAL(18,2) NOT NULL,
        TotalDesgravamen DECIMAL(18,2) NOT NULL,
        TotalAmountPaid DECIMAL(18,2) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_SimulationRecords_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
END
GO

-- 6. DATOS SEMILLA (SEED DATA QUEMADO)
-- Usuario Administrador por defecto (Contraseña encriptada con BCrypt: "password123")
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
BEGIN
    INSERT INTO dbo.Users (Username, Email, PasswordHash, CreatedAt)
    VALUES ('admin', 'admin@banco.com', '$2a$11$qE.3d.r4S5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', GETDATE());
END
GO

-- Líneas de Crédito oficiales en el sistema
IF NOT EXISTS (SELECT 1 FROM dbo.CreditTypes WHERE TypeCode = 1)
BEGIN
    INSERT INTO dbo.CreditTypes (TypeCode, Name, Description, AnnualInterestRate, MinMonths, MaxMonths, MinAmount, MaxAmount)
    VALUES (1, 'Crédito Consumo Ágil Banco', 'Financiamiento personal para libre disponibilidad', 15.50, 1, 360, 50.00, 50000.00);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.CreditTypes WHERE TypeCode = 2)
BEGIN
    INSERT INTO dbo.CreditTypes (TypeCode, Name, Description, AnnualInterestRate, MinMonths, MaxMonths, MinAmount, MaxAmount)
    VALUES (2, 'Crédito Hipotecario Vivienda', 'Adquisición de vivienda nueva o usada', 9.50, 12, 360, 3000.00, 500000.00);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.CreditTypes WHERE TypeCode = 3)
BEGIN
    INSERT INTO dbo.CreditTypes (TypeCode, Name, Description, AnnualInterestRate, MinMonths, MaxMonths, MinAmount, MaxAmount)
    VALUES (3, 'Crédito Educativo Superior', 'Financiamiento de carreras de grado y posgrado', 8.00, 6, 120, 500.00, 80000.00);
END
GO

-- Consultas de Verificación
SELECT * FROM dbo.CreditTypes;
SELECT * FROM dbo.Users;
