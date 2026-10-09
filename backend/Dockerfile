# Imagen genérica para cualquiera de los tres servicios .NET.
# Se construye con:  --build-arg PROJECT=<ruta al .csproj> --build-arg DLL=<nombre>.dll
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
ARG PROJECT
RUN dotnet publish "$PROJECT" -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ARG DLL
ENV DLL=$DLL
ENTRYPOINT dotnet $DLL
