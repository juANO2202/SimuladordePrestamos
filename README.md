# 🏦 Simulador de Préstamos (Full Stack)

Aplicación web full stack para la simulación de créditos bancarios, construida con una **arquitectura de microservicios en .NET Core**, frontend reactivo en **React (Vite)**, base de datos en **SQL Server Express** (con soporte de conmutación automática), autenticación basada en **JWT** y exportación de tablas de amortización a **PDF**.

---

## 🏗️ Arquitectura del Sistema

El proyecto está diseñado bajo patrones de diseño limpios y separación de responsabilidades:

```
                          ┌─────────────────────────┐
                          │   Frontend React App    │
                          │     (Puerto 5173)       │
                          └────────────┬────────────┘
                                       │ HTTPS / REST
                                       ▼
                          ┌─────────────────────────┐
                          │  YARP API Gateway       │
                          │     (Puerto 5000)       │
                          └────┬───────────────┬────┘
                               │               │
            /api/auth/*        │               │ /api/simulator/*
                               ▼               ▼
                ┌──────────────────┐       ┌──────────────────────────┐
                │   Auth.Service   │       │  CreditSimulator.Service │
                │  (Puerto 5001)   │       │      (Puerto 5002)       │
                └────────┬─────────┘       └────────────┬─────────────┘
                         │                              │
                         ▼                              ▼
                ┌──────────────────┐       ┌──────────────────────────┐
                │ SQL Server Ex /  │       │ SQL Server Express /     │
                │ InMemory DB      │       │ InMemory DB              │
                └──────────────────┘       └──────────────────────────┘
```

### Microservicios
1. **`Auth.Service` (`http://localhost:5001`)**:
   - Registro e Inicio de sesión de usuarios.
   - Encriptación segura de contraseñas con **BCrypt.Net**.
   - Emisión y verificación de firma de tokens **JWT**.
   - Documentación Swagger en `http://localhost:5001/swagger`.

2. **`CreditSimulator.Service` (`http://localhost:5002`)**:
   - Motor financiero de cálculo de amortizaciones (Francés y Alemán).
   - Catálogo de líneas de crédito:
     - **Consumo:** 15.5% EA (~1.29% mensual)
     - **Hipotecario:** 9.5% EA (~0.79% mensual)
     - **Educativo:** 8.0% EA (~0.67% mensual)
   - Historial de simulaciones asociadas al usuario autenticado.
   - Documentación Swagger en `http://localhost:5002/swagger`.

3. **`ApiGateway` (`http://localhost:5000`)**:
   - Punto de entrada unificado basado en **YARP (Yet Another Reverse Proxy)**.
   - Manejo centralizado de políticas de CORS.

4. **`Frontend React` (`http://localhost:5173`)**:
   - Construido con React 18, Vite y Vanilla/Custom CSS con diseño corporativo de Banco Pichincha.
   - Autenticación persistente con `AuthContext`.
   - Generador cliente de reportes en PDF con `jsPDF` y `jspdf-autotable`.

---

## 🧮 Fórmulas Financieras Implementadas

### 1. Método Francés (Cuota Fija)
- **Cuota mensual fija ($R$):**
  $$R = P \times \frac{i(1+i)^n}{(1+i)^n - 1}$$
  donde $P$ = Monto, $i$ = Tasa de interés mensual ($\text{Tasa Anual} / 12 / 100$), $n$ = Plazo en meses.
- **Interés mensual ($I_k$):** $I_k = \text{Saldo Pendiente}_{k-1} \times i$
- **Amortización a Capital ($A_k$):** $A_k = R - I_k$

### 2. Método Alemán (Amortización de Capital Constante)
- **Amortización constante a capital ($A$):**
  $$A = \frac{P}{n}$$
- **Interés mensual ($I_k$):** $I_k = \text{Saldo Pendiente}_{k-1} \times i$
- **Cuota variable decreciente ($R_k$):** $R_k = A + I_k$

---

## 🚀 Instrucciones para Levantar el Proyecto Localmente

### Prerrequisitos
- **Node.js** (v18 o superior)
- **.NET SDK** (v8.0 u v9.0)
- **SQL Server Express** (Opcional; la aplicación conmuta automáticamente a la base de datos EF Core en memoria si SQL Server Express no está en ejecución).

---

### Paso 1: Levantar los Microservicios Backend

Abre tres terminales o la solución `ProyectoAgiles.sln` en Visual Studio 2022 / VS Code:

#### Terminal 1 - Auth Service:
```bash
cd src/Services/Auth.Service/Auth.Api
dotnet run
```
*Servicio disponible en: `http://localhost:5001`*

#### Terminal 2 - Credit Simulator Service:
```bash
cd src/Services/CreditSimulator.Service/CreditSimulator.Api
dotnet run
```
*Servicio disponible en: `http://localhost:5002`*

#### Terminal 3 - API Gateway:
```bash
cd src/ApiGateway
dotnet run
```
*Gateway disponible en: `http://localhost:5000`*

---

### Paso 2: Levantar el Frontend (React)

En una cuarta terminal:

```bash
cd src/Frontend
npm install
npm run dev
```

Abre tu navegador en: `http://localhost:5173`

---

## 📑 Funcionalidades Principales en Pantalla

1. **Pantalla de Registro e Inicio de Sesión**:
   - Registro con hashing seguro de contraseñas.
   - Recepción de token JWT y mantenimiento de sesión activa.
2. **Formulario Interactivo de Simulación**:
   - Elección de **Consumo**, **Hipotecario** o **Educativo** con indicación de tasa aplicada.
   - Ajuste con deslizadores (sliders) o inputs numéricos para Monto y Plazo en meses.
   - Alternar entre **Método Francés** (cuota fija) y **Método Alemán** (cuota decreciente).
3. **Tabla de Amortización & Exportación a PDF**:
   - Visualización de la tabla con paginación mes a mes.
   - Botón **"Exportar Tabla a PDF"** que descarga el informe oficial con el membrete institucional.
4. **Historial de Simulaciones**:
   - Consulta de las cotizaciones previas realizadas por el usuario logueado.
