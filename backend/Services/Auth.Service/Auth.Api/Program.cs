using System.Text;
using Auth.Api.Data;
using Auth.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configuración de la Base de Datos con Fallback inteligente
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");

builder.Services.AddDbContext<AuthDbContext>(options =>
{
    if (useInMemory)
    {
        options.UseInMemoryDatabase("PrestamosDb");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// Registrar Servicios e Inyección de Dependencias
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Configuración de Autenticación JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SuperSecretKey_For_CreditAppSimulator_2026!#";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "BankCreditSimulator",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "BankCreditSimulatorUsers",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(o => o.SuppressModelStateInvalidFilter = true); // los controllers devuelven ApiResponse propio
builder.Services.AddEndpointsApiExplorer();

// Documentación Swagger con soporte JWT Bearer
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Simulador de Préstamos - Auth API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT usando el esquema Bearer. Ejemplo: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configuración de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Aplicar migraciones de base de datos de EF Core automáticamente
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    try
    {
        // Reintentos: SQL Server puede estar arrancando o el otro servicio puede estar creando la misma base
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                if (dbContext.Database.IsSqlServer())
                {
                    dbContext.Database.Migrate();
                }
                else
                {
                    dbContext.Database.EnsureCreated();
                }
                break;
            }
            catch when (attempt < 10)
            {
                Thread.Sleep(3000);
            }
        }
        // Garantizar que exista el usuario precargado por defecto (admin / password123).
        // El seed del modelo (HasData) trae un hash que no es BCrypt válido, así que se corrige aquí.
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var admin = dbContext.Users.FirstOrDefault(u => u.Username == "admin");
        if (admin == null)
        {
            dbContext.Users.Add(new Auth.Api.Entities.User
            {
                Username = "admin",
                Email = "admin@prestamos.com",
                PasswordHash = hasher.HashPassword("password123"),
                CreatedAt = DateTime.UtcNow
            });
            dbContext.SaveChanges();
        }
        else if (admin.PasswordHash == AuthDbContext.PlaceholderAdminHash)
        {
            admin.PasswordHash = hasher.HashPassword("password123");
            dbContext.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("Base de datos PrestamosDb ya en proceso o inicializada: {Message}", ex.Message);
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
