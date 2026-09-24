# 📘 Documento de Explicación del Proyecto: Simulador de Préstamos (Full Stack)

Este documento contiene una explicación detallada de la arquitectura, componentes, estructura de carpetas, fórmulas matemáticas y funcionamiento de la base de datos de la aplicación **Simulador de Préstamos**.

---

## 📄 Contenido

1. [Resumen General del Proyecto](#-1-resumen-general-del-proyecto)
2. [Estructura Completa de Carpetas](#-2-estructura-completa-de-carpetas)
3. [Explicación de la Arquitectura Backend (.NET Core)](#-3-explicacion-de-la-arquitectura-backend-net-core)
4. [Explicación del Frontend (React + Vite)](#-4-explicacion-del-frontend-react--vite)
5. [Lógica y Fórmulas de Amortización](#-5-logica-y-formulas-de-amortizacion)
6. [Base de Datos y Migraciones EF Core](#-6-base-de-datos-y-migraciones-ef-core)
7. [Instrucciones de Ejecución Paso a Paso](#-7-instrucciones-de-ejecucion-paso-a-paso)

---

## 📌 1. Resumen General del Proyecto

La aplicación es un **Simulador de Créditos y Préstamos Bancarios** desarrollado con una **Arquitectura de Microservicios**. 

Permite a los usuarios estimar el valor de sus cuotas mensuales, tasas de interés referenciales y desglose total para distintos tipos de crédito (**Consumo**, **Hipotecario** y **Educativo**), comparar sistemas de amortización (**Francés** y **Alemán**), ver la tabla de pagos mes a mes y **exportar comprobantes en formato PDF**.

### Stack Tecnológico Utilizado:
- **Backend:** .NET Core (Arquitectura de microservicios con C#).
- **API Gateway:** YARP (Yet Another Reverse Proxy) para enrutamiento unificado.
- **Base de Datos:** SQL Server Express (Base de datos unificada `PrestamosDb`) con Entity Framework Core (EF Core) y Migraciones activas.
- **Autenticación:** Tokens JWT (JSON Web Tokens) con encriptación BCrypt para contraseñas.
- **Frontend:** React (Vite), CSS personalizable minimalista y formal, e integración con `jsPDF` y `jspdf-autotable` para reportes.

---

## 🗂️ 2. Estructura Completa de Carpetas

A continuación se detalla la organización de archivos dentro del repositorio `ProyectoAgiles`:

```
ProyectoAgiles/
├── ProyectoAgiles.sln                  # Archivo de Solución que agrupa todos los microservicios C#
├── README.md                           # Documentación técnica general
├── EXPLICACION_PROYECTO.md             # Este documento explicativo
├── src/
│   ├── BuildingBlocks/
│   │   └── Shared.Common/              # Librería de clases compartida entre microservicios
│   │       ├── Shared.Common.csproj
│   │       ├── Dtos/                   # Data Transfer Objects (Objetos de transferencia de datos)
│   │       │   ├── AuthDtos.cs         # DTOs para Register, Login, Token y Perfil de Usuario
│   │       │   └── SimulatorDtos.cs    # DTOs para solicitudes de cálculo, opciones y tabla
│   │       ├── Enums/                  # Enumeradores del sistema
│   │       │   ├── CreditTypeEnum.cs   # (Consumo = 1, Hipotecario = 2, Educativo = 3)
│   │       │   └── AmortizationMethodEnum.cs # (Francés = 1, Alemán = 2)
│   │       └── Models/
│   │           └── ApiResponse.cs      # Formato estándar de respuesta JSON (Success, Message, Data, Errors)
│   │
│   ├── Services/
│   │   ├── Auth.Service/               # Microservicio de Autenticación
│   │   │   └── Auth.Api/
│   │   │       ├── Auth.Api.csproj
│   │   │       ├── appsettings.json    # Conexión a PrestamosAuthDb y secreto JWT
│   │   │       ├── Program.cs          # Configuración de servicios, Swagger y arranque
│   │   │       ├── Controllers/
│   │   │       │   └── AuthController.cs # Endpoints: POST /api/auth/register, POST /login, GET /me
│   │   │       ├── Data/
│   │   │       │   └── AuthDbContext.cs  # DbContext de EF Core para la tabla Users
│   │   │       ├── Entities/
│   │   │       │   └── User.cs         # Modelo de datos del usuario (Id, Username, Email, PasswordHash)
│   │   │       ├── Migrations/         # Migraciones oficiales de EF Core (InitialCreate)
│   │   │       └── Services/
│   │   │           ├── PasswordHasher.cs # Encriptación y verificación BCrypt
│   │   │           ├── TokenService.cs   # Generador de Tokens JWT
│   │   │           └── AuthService.cs    # Lógica de negocio para login y registro
│   │   │
│   │   └── CreditSimulator.Service/    # Microservicio de Simulación de Créditos
│   │       └── CreditSimulator.Api/
│   │           ├── CreditSimulator.Api.csproj
│   │           ├── appsettings.json    # Conexión a PrestamosSimulatorDb y secreto JWT
│   │           ├── Program.cs          # Configuración de servicios, Swagger y arranque
│   │           ├── Controllers/
│   │           │   └── SimulatorController.cs # Endpoints: GET /credit-types, POST /calculate, GET /history
│   │           ├── Data/
│   │           │   └── SimulatorDbContext.cs # DbContext EF Core (Tablas CreditTypes y SimulationRecords)
│   │           ├── Entities/
│   │           │   ├── CreditType.cs       # Entidad con tasas y rangos por tipo de crédito
│   │           │   └── SimulationRecord.cs # Entidad para guardar el historial por usuario
│   │           ├── Migrations/             # Migraciones oficiales de EF Core (InitialCreate)
│   │           └── Services/
│   │               ├── AmortizationEngine.cs # Algoritmos matemáticos de amortización Francés y Alemán
│   │               └── CreditSimulatorService.cs # Servicio de catálogo, validación e historial
│   │
│   ├── ApiGateway/                      # API Gateway (Punto de entrada unificado)
│   │   ├── ApiGateway.csproj
│   │   ├── appsettings.json             # Reglas de enrutamiento YARP para Auth y Simulator
│   │   └── Program.cs                   # Configuración de proxy y CORS
│   │
│   └── Frontend/                        # Aplicación Cliente Web (React + Vite)
│       ├── package.json                 # Dependencias (react, jspdf, jspdf-autotable, lucide-react)
│       ├── vite.config.js               # Configuración del servidor de desarrollo (puerto 5173/5174)
│       ├── index.html                   # Documento HTML principal
│       └── src/
│           ├── index.css                # Sistema de diseño CSS minimalista blanco y formal
│           ├── main.jsx                 # Punto de entrada de React DOM
│           ├── App.jsx                  # Componente raíz con enrutamiento de autenticación
│           ├── components/
│           │   ├── Navbar.jsx           # Barra superior corporativa con logo e información de sesión
│           │   └── AmortizationTable.jsx # Tabla interactiva de amortización mes a mes y botón PDF
│           ├── context/
│           │   └── AuthContext.jsx      # Proveedor global de estado para el usuario y token JWT
│           ├── pages/
│           │   ├── LoginPage.jsx        # Pantalla de Inicio de Sesión
│           │   ├── RegisterPage.jsx     # Pantalla de Registro de Usuario
│           │   ├── SimulatorPage.jsx    # Pantalla principal del simulador (Pasos 1 y 2 + Comprobante)
│           │   └── HistoryPage.jsx      # Pantalla para consultar el historial de cotizaciones
│           ├── services/
│           │   └── api.js               # Cliente HTTP con fallback (API Gateway -> Microservicio)
│           └── utils/
│               └── pdfGenerator.js      # Módulo para generar y descargar comprobantes en PDF
```

---

## 🏗️ 3. Explicación de la Arquitectura Backend (.NET Core)

La arquitectura backend está dividida en **Microservicios independientes**, siguiendo los principios de la arquitectura limpia (Separación de Controladores, Servicios, Dominio/Entidades y Datos):

```
                        ┌────────────────────────┐
                        │   Cliente Web React    │
                        └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │   YARP API Gateway     │
                        │    (Puerto 5000)       │
                        └─────┬────────────┬─────┘
                              │            │
           /api/auth/*        │            │ /api/simulator/*
                              ▼            ▼
                     ┌──────────────┐ ┌──────────────────┐
                     │ Auth.Service │ │CreditSimulator.Api│
                     │(Puerto 5001) │ │  (Puerto 5002)   │
                     └──────┬───────┘ └────────┬─────────┘
                            │                  │
                            ▼                  ▼
                    ┌──────────────┐ ┌──────────────────┐
                    │ SQL Server:  │ │ SQL Server:      │
                    │PrestamosAuth │ │PrestamosSimulator│
                    └──────────────┘ └──────────────────┘
```

1. **`BuildingBlocks/Shared.Common`**: Contiene los DTOs y estructuras que comparten los microservicios, evitando código duplicado.
2. **`Auth.Service`**: Maneja el ciclo de vida de los usuarios. Cuando un usuario se registra, encripta la contraseña usando **BCrypt**. Cuando inicia sesión, valida las credenciales y devuelve un **Token JWT** firmado.
3. **`CreditSimulator.Service`**: Contiene el motor financiero `AmortizationEngine`. Recibe el monto, plazo, tipo de crédito y método de amortización, realiza el cálculo y devuelve la tabla detallada. Si el usuario envía un token JWT en el header `Authorization`, guarda un registro en el historial.
4. **`ApiGateway`**: Recibe las solicitudes del frontend y las redirige al microservicio correspondiente usando el proxy **YARP**.

---

## 🎨 4. Explicación del Frontend (React + Vite)

El frontend está diseñado con una **estética minimalista, limpia y formal**, con fondo blanco, bordes finos, tipografía oscura y barra superior de acento.

### Flujo de la Interfaz:
- **Pantalla de Autenticación (`LoginPage` / `RegisterPage`):** Permite iniciar sesión o crear una cuenta. Al autenticarse, guarda el token JWT en el almacenamiento local (`localStorage`).
- **Simulador - Paso 1 (Pantalla de Selección):** Presenta una interfaz limpia con la pregunta **"¿Que crédito necesitas?"** y un menú desplegable con las opciones (*Consumo*, *Hipotecario*, *Educativo*).
- **Simulador - Paso 2 (Calculadora y Comprobante):**
  - **Lado Izquierdo (Formulario):** Muestra los inputs numéricos (Monto, Plazo) y las tarjetas del sistema de pago de intereses (**Método Francés** o **Método Alemán**).
  - **Lado Derecho (Comprobante Visual):** Desglosa los pagos en tiempo real: `$ Capital + $ Interés + $ Seguro`, muestra el monto de la cuota mensual, el detalle completo del crédito y el enlace para abrir la **Tabla de Amortización**.
- **Exportación a PDF (`pdfGenerator.js`):** Utiliza las librerías `jsPDF` y `jspdf-autotable` para renderizar un documento PDF oficial descargable con 1 solo clic.

---

## 🧮 5. Lógica y Fórmulas de Amortización

El motor financiero `AmortizationEngine.cs` implementa las dos metodologías bancarias estándar:

### 1. Método Francés (Cuota Fija)
Es el sistema más común. La cuota total pagada por el usuario es **constante** todos los meses, pero la proporción de interés disminuye y la amortización a capital aumenta con cada cuota.

- **Fórmula de la Cuota Mensual ($R$):**
  $$R = P \times \frac{i(1+i)^n}{(1+i)^n - 1}$$
  *donde:*
  - $P$: Monto del préstamo solicitado.
  - $i$: Tasa de interés mensual ($\frac{\text{Tasa Anual}}{12 \times 100}$).
  - $n$: Número de meses (plazo).

- **Interés de cada mes ($I_k$):** $I_k = \text{Saldo Pendiente}_{k-1} \times i$
- **Capital amortizado ($A_k$):** $A_k = R - I_k$
- **Saldo restante ($S_k$):** $S_k = S_{k-1} - A_k$

---

### 2. Método Alemán (Amortización a Capital Constante)
La amortización a capital abonada en cada mes es **fija e igual**, mientras que los intereses se calculan sobre el saldo adeudado. Como resultado, la cuota total pagada es **decreciente** (más alta el primer mes y más baja al final).

- **Amortización a capital constante ($A$):**
  $$A = \frac{P}{n}$$
- **Interés de cada mes ($I_k$):** $I_k = \text{Saldo Pendiente}_{k-1} \times i$
- **Cuota variable mensual ($R_k$):** $R_k = A + I_k$
- **Saldo restante ($S_k$):** $S_k = S_{k-1} - A$

---

## 🗄️ 6. Base de Datos y Migraciones EF Core

El sistema utiliza **Entity Framework Core 8/10** con proveedor de **SQL Server Express**:

### Base de Datos Única:
- **`PrestamosDb`**:
  - Tabla `Users`: Almacena `Id`, `Username`, `Email`, `PasswordHash`, `CreatedAt`.
  - Tabla `CreditTypes`: Catálogo con tasas referenciales (**Consumo 15.5%**, **Hipotecario 9.5%**, **Educativo 8.0%**).
  - Tabla `SimulationRecords`: Registro histórico de cotizaciones realizadas por los usuarios.

### Funcionamiento de las Migraciones (`Migrations`):
- Los proyectos contienen carpetas oficiales `Migrations/` creadas mediante `dotnet ef migrations add InitialCreate`.
- Al arrancar los backend (`dotnet run`), se ejecuta el método `dbContext.Database.Migrate()` en `Program.cs`. Esto aplica automáticamente cualquier cambio o tabla pendiente en tu SQL Server Express sin necesidad de ejecutar scripts SQL manuales.

---

## 🚀 7. Instrucciones de Ejecución Paso a Paso

### Paso 1: Encender los Microservicios Backend (.NET)
Abre 3 terminales (CMD o PowerShell) y ejecuta:

```cmd
# Terminal 1: Auth Service (Puerto 5001)
cd "C:\Users\juani\OneDrive\Escritorio\ProyectoAgiles\src\Services\Auth.Service\Auth.Api"
dotnet run

# Terminal 2: Credit Simulator Service (Puerto 5002)
cd "C:\Users\juani\OneDrive\Escritorio\ProyectoAgiles\src\Services\CreditSimulator.Service\CreditSimulator.Api"
dotnet run

# Terminal 3: API Gateway (Puerto 5000)
cd "C:\Users\juani\OneDrive\Escritorio\ProyectoAgiles\src\ApiGateway"
dotnet run
```

---

### Paso 2: Encender el Frontend (React)
En una cuarta terminal:

```cmd
cd "C:\Users\juani\OneDrive\Escritorio\ProyectoAgiles\src\Frontend"
npm run dev
```

---

### Paso 3: Probar en el Navegador
Abre tu navegador e ingresa a:
👉 **`http://localhost:5173/`** *(o `http://localhost:5174/`)*

1. Regístrate con un nuevo usuario.
2. Selecciona el tipo de crédito que necesitas.
3. Ajusta el monto, plazo y elige entre **Método Francés** o **Método Alemán**.
4. Haz clic en **"Ver tabla de amortización"** y luego en **"Exportar Tabla a PDF"**.
