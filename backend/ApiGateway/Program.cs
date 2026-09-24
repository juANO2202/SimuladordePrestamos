var builder = WebApplication.CreateBuilder(args);

// Configurar YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Configurar CORS para permitir comunicación desde el frontend React (puerto 5173 / cualquier puerto local)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

app.MapGet("/", () => Results.Ok(new
{
    Service = "Simulador de Préstamos - API Gateway",
    Status = "Online",
    Routes = new[]
    {
        "/api/auth/* -> Auth.Service (http://localhost:5001)",
        "/api/simulator/* -> CreditSimulator.Service (http://localhost:5002)"
    }
}));

app.MapReverseProxy();

app.Run("http://localhost:5000");
