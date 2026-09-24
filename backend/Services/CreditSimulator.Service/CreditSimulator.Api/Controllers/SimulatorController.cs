using System.Security.Claims;
using CreditSimulator.Api.Entities;
using CreditSimulator.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Dtos;
using Shared.Common.Models;

namespace CreditSimulator.Api.Controllers
{
    [ApiController]
    [Route("api/simulator")]
    public class SimulatorController : ControllerBase
    {
        private readonly ICreditSimulatorService _simulatorService;

        public SimulatorController(ICreditSimulatorService simulatorService)
        {
            _simulatorService = simulatorService;
        }

        [HttpGet("credit-types")]
        [ProducesResponseType(typeof(ApiResponse<List<CreditTypeOptionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCreditTypes()
        {
            var result = await _simulatorService.GetCreditTypesAsync();
            return Ok(result);
        }

        [HttpPost("calculate")]
        [ProducesResponseType(typeof(ApiResponse<CalculateCreditResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CalculateCreditResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Calculate([FromBody] CalculateCreditRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CalculateCreditResponseDto>.Fail("Parámetros de simulación inválidos.",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
            }

            int? userId = null;
            string? username = null;

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var id))
            {
                userId = id;
                username = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value;
            }

            var result = await _simulatorService.CalculateCreditAsync(request, userId, username);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

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
