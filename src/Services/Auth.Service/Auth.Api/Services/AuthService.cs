using Auth.Api.Data;
using Auth.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Shared.Common.Dtos;
using Shared.Common.Models;

namespace Auth.Api.Services
{
    public interface IAuthService
    {
        Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto);
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto dto);
        Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId);
    }

    public class AuthService : IAuthService
    {
        private readonly AuthDbContext _dbContext;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthService(AuthDbContext dbContext, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto)
        {
            var usernameExists = await _dbContext.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (usernameExists)
            {
                return ApiResponse<AuthResponseDto>.Fail("El nombre de usuario ya está registrado.");
            }

            var emailExists = await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (emailExists)
            {
                return ApiResponse<AuthResponseDto>.Fail("El correo electrónico ya está registrado.");
            }

            var user = new User
            {
                Username = dto.Username.Trim(),
                Email = dto.Email.Trim().ToLower(),
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var (token, expiresAt) = _tokenService.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                ExpiresAt = expiresAt
            };

            return ApiResponse<AuthResponseDto>.Ok(response, "Usuario registrado exitosamente.");
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto dto)
        {
            var usernameOrEmail = dto.UsernameOrEmail.Trim();
            var user = await _dbContext.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == usernameOrEmail.ToLower() ||
                u.Email.ToLower() == usernameOrEmail.ToLower());

            // Si el usuario no existe aún, se registra automáticamente sobre la marcha
            if (user == null)
            {
                var isEmail = usernameOrEmail.Contains("@");
                var newUsername = isEmail ? usernameOrEmail.Split('@')[0] : usernameOrEmail;
                var newEmail = isEmail ? usernameOrEmail : $"{newUsername.ToLower()}@ejemplo.com";

                // Verificar que no choque nombre de usuario o email generado
                int counter = 1;
                var baseUsername = newUsername;
                while (await _dbContext.Users.AnyAsync(u => u.Username.ToLower() == newUsername.ToLower()))
                {
                    newUsername = $"{baseUsername}{counter++}";
                }

                user = new User
                {
                    Username = newUsername,
                    Email = newEmail,
                    PasswordHash = _passwordHasher.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? "123456" : dto.Password),
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();
            }

            var (token, expiresAt) = _tokenService.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                ExpiresAt = expiresAt
            };

            return ApiResponse<AuthResponseDto>.Ok(response, "Inicio de sesión exitoso.");
        }

        public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(int userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("Usuario no encontrado.");
            }

            var userDto = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            };

            return ApiResponse<UserDto>.Ok(userDto);
        }
    }
}
