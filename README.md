# 🏦 Simulador de Préstamos Bancarios (Arquitectura de Microservicios)

Aplicación web full stack corporativa para la simulación de créditos bancarios, calculo de amortizaciones y seguros de desgravamen. Construida con una **Arquitectura de Microservicios en .NET 8**, **YARP API Gateway**, frontend reactivo en **React 18 (Vite)**, base de datos en **SQL Server Express** (`PrestamosDb`) y exportador de reportes a **PDF**.

---

## 📐 1. Arquitectura del Sistema y Flujo de Datos

El sistema sigue el patrón **API Gateway / Microservicios Desacoplados**:

```
                                  ┌───────────────────────────┐
                                  │    Frontend React App     │
                                  │      (Puerto 5173)        │
                                  └─────────────┬─────────────┘
                                                │ REST / JSON (con Token JWT)
                                                ▼
                                  ┌───────────────────────────┐
                                  │     YARP API Gateway      │
                                  │      (Puerto 5000)        │
                                  └──────┬─────────────┬──────┘
                                         │             │
                    /api/auth/*          │             │ /api/simulator/*
                                         ▼             ▼
                          ┌──────────────────┐     ┌────────────────────────────┐
                          │   Auth.Service   │     │  CreditSimulator.Service   │
                          │  (Puerto 5001)   │     │       (Puerto 5002)        │
                          └────────┬─────────┘     └─────────────┬──────────────┘
                                   │                             │
                                   ▼                             ▼
                          ┌─────────────────────────────────────────────┐
                          │     SQL Server Express (PrestamosDb)        │
                          │         dbo.Users / dbo.CreditTypes         │
                          │            dbo.SimulationRecords            │
                          └─────────────────────────────────────────────┘
```

### 🔄 Secuencia del Flujo de Datos (Paso a Paso)
1. **Interacción en la UI (React):** El usuario ingresa monto (ej: `$50.000`), plazo (ej: `24 meses`) y selecciona el sistema de amortización (Francés o Alemán).
2. **Consumo HTTP Centralizado (`api.js`):** El cliente invoca `apiFetch('/simulator/calculate', { method: 'POST', body: ... })` inyectando automáticamente la cabecera `Authorization: Bearer <token>` si hay sesión iniciada.
3. **API Gateway (`Puerto 5000`):** **YARP** (*Yet Another Reverse Proxy*) intercepta la ruta `/api/simulator/*`, valida las políticas CORS y realiza un proxy transparente hacia `http://localhost:5002/api/simulator/calculate`.
4. **Procesamiento en `CreditSimulator.Api` (`Puerto 5002`):**
   - El controlador `SimulatorController` recibe el DTO `CalculateCreditRequestDto`.
   - El servicio `AmortizationEngine` realiza la conversión de **Tasa Efectiva Anual (TEA)** a **Tasa Efectiva Mensual (TEM)**:
     $$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$
   - Genera el cronograma de pagos cuota a cuota aplicando la matemática del método seleccionado más el **Seguro de Desgravamen** ($0.06\%$ mensual).
   - Si el usuario está autenticado, persiste la simulación en `dbo.SimulationRecords` en SQL Server.
5. **Respuesta y Renderizado:** Retorna `ApiResponse<CalculateCreditResponseDto>` HTTP 200 OK. React actualiza las 4 Tarjetas KPI y la Tabla de 7 Columnas.
6. **Exportación a PDF:** Al presionar *"Descargar PDF"*, `pdfGenerator.js` utiliza `jsPDF` y `AutoTable` para construir el documento impreso oficial.

---

## 📂 2. Explicación de la Estructura de Carpetas y Archivos

```text
ProyectoAgiles/
├── ProyectoAgiles.sln                  # Archivo de solución que agrupa los proyectos .NET
└── src/
    ├── ApiGateway/                     # Puerta de entrada única (Proxy YARP)
    │   ├── Program.cs                  # Configuración de YARP Proxy y CORS
    │   └── appsettings.json            # Reglas de enrutamiento (/api/auth/*, /api/simulator/*)
    │
    ├── BuildingBlocks/                 # Librería común compartida
    │   └── Shared.Common/
    │       ├── Dtos/                   # Objetos de transferencia de datos JSON (Request/Response)
    │       ├── Enums/                  # Enumeraciones (AmortizationMethodEnum, CreditTypeEnum)
    │       └── Models/                 # ApiResponse<T> unificado
    │
    ├── Services/                       # Microservicios Backend en .NET 8
    │   ├── Auth.Service/
    │   │   └── Auth.Api/
    │   │       ├── Controllers/        # AuthController.cs (/register, /login, /me)
    │   │       ├── Data/               # AuthDbContext.cs (Entity Framework Core)
    │   │       ├── Entities/           # User.cs (Mapeo a dbo.Users)
    │   │       └── Services/           # JwtTokenService.cs (Firmado de tokens HMAC-SHA256)
    │   │
    │   └── CreditSimulator.Service/
    │       └── CreditSimulator.Api/
    │           ├── Controllers/        # SimulatorController.cs (/credit-types, /calculate, /history)
    │           ├── Data/               # SimulatorDbContext.cs
    │           ├── Entities/           # CreditType.cs, SimulationRecord.cs
    │           └── Services/           # AmortizationEngine.cs (Motor matemático financiero)
    │
    └── Frontend/                       # Aplicación Web en React 18 + Vite
        └── src/
            ├── App.jsx                 # Enrutador dinámico (React Router DOM)
            ├── main.jsx                # Punto de entrada de React
            ├── components/
            │   └── AmortizationTable.jsx # Tabla de 7 columnas financieras con paginación
            ├── context/
            │   └── AuthContext.jsx     # Gestión del estado de sesión y Token JWT
            ├── pages/
            │   ├── SimulatorPage.jsx   # Vista principal del simulador y formulario
            │   ├── LoginPage.jsx       # Vista de inicio de sesión
            │   ├── RegisterPage.jsx    # Vista de registro de usuarios
            │   └── HistoryPage.jsx     # Historial de simulaciones persistidas
            ├── services/
            │   └── api.js              # Cliente HTTP centralizado apiFetch
            └── utils/
                └── pdfGenerator.js     # Generador de reportes PDF (jsPDF + AutoTable)
```

---

## 🧮 3. Fórmulas Financieras e Inserciones de Código Destacadas

### A. Conversión de Tasa Efectiva Anual (TEA) a Mensual (TEM)
$$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$

### B. Sistema Francés (Cuota Base Fija)
$$R = P \times \frac{i(1+i)^n}{(1+i)^n - 1}$$
*donde $P$ = Monto Principal, $i$ = TEM, $n$ = Plazo en meses.*

### C. Sistema Alemán (Capital Constante)
$$C = \frac{P}{n}$$
*Cuota variable decreciente: $R_k = C + I_k + \text{Desgravamen}_k$.*

### D. Seguro de Desgravamen
$$\text{Desgravamen}_k = \text{Saldo Inicial}_k \times 0.0006$$

### E. Formateador de Miles en JavaScript Nativo con Preservación de Cursor
```javascript
// Remueve caracteres no numéricos, aplica separador de miles con Regex y preserva la posición del cursor
const digitsBeforeCursor = rawVal.slice(0, cursorPos).replace(/\D/g, '').length;
const cleanDigits = rawVal.replace(/\D/g, '');
const formatted = cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

requestAnimationFrame(() => {
  let newPos = 0, count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count++;
    if (count === digitsBeforeCursor) { newPos = i + 1; break; }
  }
  inputEl.setSelectionRange(newPos, newPos);
});
```

---

## 🚀 4. Instrucciones para Levantar el Proyecto Localmente

### Prerrequisitos
- **Node.js** (v18 o superior)
- **.NET SDK** (v8.0)
- **SQL Server Express** (`localhost\SQLEXPRESS` con la base de datos `PrestamosDb`)

---

### Paso 1: Levantar los Microservicios Backend

Abre 3 terminales independientes (o ejecuta el proyecto desde Visual Studio):

#### Terminal 1 - Auth Service (Puerto 5001):
```bash
cd src/Services/Auth.Service/Auth.Api
dotnet run
```

#### Terminal 2 - Credit Simulator Service (Puerto 5002):
```bash
cd src/Services/CreditSimulator.Service/CreditSimulator.Api
dotnet run
```

#### Terminal 3 - API Gateway (Puerto 5000):
```bash
cd src/ApiGateway
dotnet run
```

---

### Paso 2: Levantar el Frontend React (Puerto 5173)

En una cuarta terminal:
```bash
cd src/Frontend
npm install
npm run dev
```

Accede desde tu navegador a: **`http://localhost:5173`**

---

## 🛠️ 5. Guía Paso a Paso: Cómo Crear una Nueva Base de Datos, Tabla con Datos Quemados, Nuevo Microservicio y Consumirlo en React

Si en una evaluación te solicitan agregar una **nueva base de datos**, **nueva tabla con datos quemados**, un **nuevo microservicio .NET** que la consulte y mostrarla en el **Frontend React**, sigue este procedimiento:

---

### 🛢️ PASO 1: Crear la Base de Datos y Tabla en SQL Server
Abre SQL Server Management Studio (SSMS) y ejecuta:

```sql
-- 1. Crear base de datos
CREATE DATABASE NovedadesDb;
GO

USE NovedadesDb;
GO

-- 2. Crear tabla
CREATE TABLE dbo.Novedades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255) NOT NULL,
    FechaPublicacion DATETIME DEFAULT GETDATE()
);
GO

-- 3. Insertar datos quemados
INSERT INTO dbo.Novedades (Titulo, Descripcion)
VALUES 
('Tasa Preferencial Educativa', 'Disfruta de una tasa especial del 8.0% TEA para créditos universitarios.'),
('Mantenimiento Programado', 'El sistema entrará en mantenimiento el domingo a las 02:00 AM.'),
('Nuevos Plazos a 30 Años', 'Ahora puedes cotizar tu crédito hipotecario hasta 360 meses.');
GO
```

---

### 💻 PASO 2: Crear el nuevo Microservicio en .NET (`Novedades.Api`)

En tu consola dentro de `src/Services`:

```bash
mkdir Novedades.Service
cd Novedades.Service
dotnet new webapi -n Novedades.Api
cd Novedades.Api

# Instalar Entity Framework Core para SQL Server
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.0
```

---

### 🧩 PASO 3: Definir la Entidad, DbContext y Controlador

#### A. Entidad `Entities/Novedad.cs`
```csharp
namespace Novedades.Api.Entities
{
    public class Novedad
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; }
    }
}
```

#### B. DbContext `Data/NovedadesDbContext.cs`
```csharp
using Microsoft.EntityFrameworkCore;
using Novedades.Api.Entities;

namespace Novedades.Api.Data
{
    public class NovedadesDbContext : DbContext
    {
        public NovedadesDbContext(DbContextOptions<NovedadesDbContext> options) : base(options) { }
        public DbSet<Novedad> Novedades { get; set; }
    }
}
```

#### C. Controlador `Controllers/NovedadesController.cs`
```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Novedades.Api.Data;

namespace Novedades.Api.Controllers
{
    [ApiController]
    [Route("api/novedades")]
    public class NovedadesController : ControllerBase
    {
        private readonly NovedadesDbContext _context;
        public NovedadesController(NovedadesDbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetNovedades()
        {
            var data = await _context.Novedades.ToListAsync();
            return Ok(new { success = true, data });
        }
    }
}
```

#### D. Configurar `Program.cs` en `Novedades.Api`
```csharp
using Microsoft.EntityFrameworkCore;
using Novedades.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NovedadesDbContext>(options =>
    options.UseSqlServer("Server=localhost\\SQLEXPRESS;Database=NovedadesDb;Trusted_Connection=True;TrustServerCertificate=True;"));

builder.Services.AddControllers();

var app = builder.Build();
app.MapControllers();
app.Run("http://localhost:5003"); // Escuchar en el puerto 5003
```

---

### 🌐 PASO 4: Registrar la Ruta en el API Gateway (YARP)

Edita `src/ApiGateway/appsettings.json` para enrutar `/api/novedades/*` al nuevo puerto `5003`:

```json
{
  "ReverseProxy": {
    "Routes": {
      "novedades-route": {
        "ClusterId": "novedades-cluster",
        "Match": { "Path": "/api/novedades/{**catch-all}" }
      }
    },
    "Clusters": {
      "novedades-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://localhost:5003" }
        }
      }
    }
  }
}
```

---

### 🎨 PASO 5: Consumir y Mostrar los Datos en React

Crea el componente `src/Frontend/src/pages/NovedadesPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const NovedadesPage = () => {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovedades = async () => {
      try {
        const res = await apiFetch('/novedades');
        if (res && res.success) setNovedades(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovedades();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Novedades del Banco</h2>
      {loading ? <p>Cargando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {novedades.map(n => (
            <div key={n.id} style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{n.titulo}</h3>
              <p style={{ color: '#64748b', margin: 0 }}>{n.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 🚀 PASO 6: Levantar el Nuevo Microservicio
Ejecuta la nueva API:
```bash
cd src/Services/Novedades.Service/Novedades.Api
dotnet run
```
¡Listo! La petición realizada desde React viajará a través del **API Gateway (Puerto 5000)** al **Nuevo Microservicio (Puerto 5003)**, consultará **`NovedadesDb`** en SQL Server y presentará la información quemada en pantalla.
