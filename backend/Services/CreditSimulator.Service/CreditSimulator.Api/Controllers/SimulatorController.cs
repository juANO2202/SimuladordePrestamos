// ====================================================================================================
// PROYECTO UNIVERSITARIO: SIMULADOR DE PRÉSTAMOS / CRÉDITOS BANCARIOS (MICROSERVICIOS)
// INTEGRANTE / EXPOSITOR: Estudiante de Ingeniería de Software / Sistemas
// MATERIA: Arquitectura de Software / Sistemas Distribuidos / Desarrollo Web Avanzado
// ====================================================================================================
// ARCHIVO: SimulatorController.cs
// PROPÓSITO: Controlador RESTful en ASP.NET Core API que expone los endpoints de simulación crediticia:
//            1. GET  /api/simulator/credit-types -> Catálogo de líneas de crédito (Consumo, Hipotecario, Educativo)
//            2. POST /api/simulator/calculate    -> Cálculo dinámico del cronograma de cuotas y desgravamen
//            3. GET  /api/simulator/history      -> Historial de simulaciones persistidas para el usuario logueado
// ====================================================================================================

using System.Security.Claims;
using CreditSimulator.Api.Entities;
using CreditSimulator.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Dtos;
using Shared.Common.Models;

namespace CreditSimulator.Api.Controllers
{
    /// <summary>
    /// Controlador principal del Microservicio de Simulación de Créditos.
    /// Atiende solicitudes HTTP JSON enviadas desde el Frontend a través del ApiGateway (YARP).
    /// </summary>
    [ApiController]
    [Route("api/simulator")]
    public class SimulatorController : ControllerBase
    {
        private readonly ICreditSimulatorService _simulatorService;

        /// <summary>
        /// Constructor con Inyección de Dependencias.
        /// Recibe el servicio de negocio 'ICreditSimulatorService' registrado en el contenedor IoC.
        /// </summary>
        public SimulatorController(ICreditSimulatorService simulatorService)
        {
            _simulatorService = simulatorService;
        }

        /// <summary>
        /// Endpoint público para obtener el catálogo de líneas de crédito registradas en la base de datos (PrestamosDb).
        /// </summary>
        /// <returns>HTTP 200 OK con la lista de opciones (monto mín/máx, plazo mín/máx, tasa TEA).</returns>
        [HttpGet("credit-types")]
        [ProducesResponseType(typeof(ApiResponse<List<CreditTypeOptionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCreditTypes()
        {
            var result = await _simulatorService.GetCreditTypesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Endpoint principal para procesar y calcular la tabla de amortización oficial.
        /// Soporta tanto usuarios anónimos como usuarios autenticados vía JWT Token.
        /// </summary>
        /// <param name="request">Objeto JSON enviado en el Body con Monto, Plazo, Método (Francés/Alemán).</param>
        /// <returns>HTTP 200 OK con la amortización completa y totales, o HTTP 400 Bad Request si los datos son fuera de rango.</returns>
        [HttpPost("calculate")]
        [ProducesResponseType(typeof(ApiResponse<CalculateCreditResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CalculateCreditResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Calculate([FromBody] CalculateCreditRequestDto request)
        {
            // Validar DataAnnotations declaradas en el DTO (ej: Monto > 0, Plazo entre 1 y 360)
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CalculateCreditResponseDto>.Fail("Parámetros de simulación inválidos.",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            int? userId = null;
            string? username = null;

            // Extraer de los Claims del JWT Token la identidad del usuario logueado (si existe)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var id))
            {
                userId = id;
                username = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value;
            }

            // Ejecutar lógica de negocio a través del servicio
            var result = await _simulatorService.CalculateCreditAsync(request, userId, username);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Endpoint protegido con atributo [Authorize]. Requiere un Token JWT válido en el Header Authorization: Bearer <token>.
        /// Retorna el historial guardado de las simulaciones realizadas por el usuario logueado.
        /// </summary>
        [HttpGet("history")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<List<SimulationRecord>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<List<SimulationRecord>>.Fail("Usuario no autenticado."));
            }

            var result = await _simulatorService.GetHistoryAsync(userId);
            return Ok(result);
        }
    }
}
