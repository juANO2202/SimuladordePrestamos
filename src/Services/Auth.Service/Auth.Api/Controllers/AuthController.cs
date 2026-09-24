// ====================================================================================================
// PROYECTO UNIVERSITARIO: SIMULADOR DE PRÉSTAMOS / CRÉDITOS BANCARIOS (MICROSERVICIOS)
// INTEGRANTE / EXPOSITOR: Estudiante de Ingeniería de Software / Sistemas
// MATERIA: Seguridad en Aplicaciones / Arquitectura de Software / Microservicios
// ====================================================================================================
// ARCHIVO: AuthController.cs
// PROPÓSITO: Microservicio independiente de Autenticación y Usuarios (Auth.Api).
//            Expone endpoints HTTP para Registro, Inicio de Sesión (Login) y Obtención del Perfil Actual.
//            Utiliza tokens JWT (JSON Web Tokens) con firma HMAC-SHA256 para autenticación sin estado (Stateless).
// ====================================================================================================

using System.Security.Claims;
using Auth.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Dtos;
using Shared.Common.Models;

namespace Auth.Api.Controllers
{
    /// <summary>
    /// Controlador RESTful encargado de la gestión de identidades y autenticación de usuarios.
    /// Operaciones: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        /// <summary>
        /// Constructor con Inyección de Dependencias.
        /// Recibe el servicio 'IAuthService' para delegar la hashing de contraseñas y emisión de JWTs.
        /// </summary>
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Endpoint para registrar nuevos usuarios en la base de datos SQL Server (PrestamosDb).
        /// Hashea la contraseña con BCrypt antes de almacenarla por estándares de seguridad OWASP.
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Datos de registro inválidos.",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            var result = await _authService.RegisterAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Endpoint para autenticar usuarios existentes.
        /// Compara las credenciales (Username y Password) y genera un Token JWT firmado si es exitoso.
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Datos de login inválidos.",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            var result = await _authService.LoginAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Endpoint protegido para validar si el token guardado en el navegador sigue activo y válido.
        /// Extrae las Claims de la solicitud HTTP autenticada.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<UserDto>.Fail("Usuario no autenticado."));
            }

            var result = await _authService.GetCurrentUserAsync(userId);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
    }
}
