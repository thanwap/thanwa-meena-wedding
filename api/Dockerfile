FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY WeddingApi.sln .
COPY WeddingApi/WeddingApi.csproj WeddingApi/
RUN dotnet restore WeddingApi/WeddingApi.csproj

COPY WeddingApi/ WeddingApi/
RUN dotnet publish WeddingApi/WeddingApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "WeddingApi.dll"]
