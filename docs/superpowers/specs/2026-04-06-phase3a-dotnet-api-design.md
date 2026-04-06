# Phase 3a: .NET 10 API — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

A .NET 10 Web API living at `api/` in the repo root. Provides full CRUD for a `configs` table in Supabase PostgreSQL, secured by Google ID token validation. Follows Controller → Service → DbContext layering for clean unit testability.

This is sub-project 1 of Phase 3. Sub-projects 2 (Next.js `/admin` page) and 3 (CI/CD) follow after this.

---

## Project Structure

```
api/
├── WeddingApi.sln
├── WeddingApi/
│   ├── Program.cs
│   ├── Controllers/
│   │   └── ConfigController.cs        # All 5 CRUD endpoints, [Authorize] on class
│   ├── Data/
│   │   ├── AppDbContext.cs             # EF Core DbContext
│   │   └── Migrations/                # Code-first migrations
│   ├── Entities/
│   │   └── Config.cs                  # EF Core entity
│   ├── Dtos/
│   │   └── ConfigDto.cs               # Request/response DTO
│   ├── Services/
│   │   ├── IConfigService.cs
│   │   └── ConfigService.cs           # Business logic, calls DbContext
│   ├── appsettings.json
│   └── appsettings.Development.json
├── WeddingApi.UnitTests/
│   ├── WeddingApi.UnitTests.csproj
│   └── ConfigControllerTests.cs       # xUnit + Moq
└── WeddingApi.IntegrationTests/
    ├── WeddingApi.IntegrationTests.csproj
    └── ConfigApiTests.cs              # xUnit + WebApplicationFactory + Testcontainers
```

---

## Entity: `Config`

File: `WeddingApi/Entities/Config.cs`

Maps to table `configs` in Supabase PostgreSQL.

| Property | Column type | Constraints |
|---|---|---|
| `Id` | `integer` | PK, auto-increment |
| `Key` | `character varying(100)` | Not null, unique |
| `Value` | `character varying(300)` | Not null |
| `Type` | `character varying(50)` | Not null |
| `CreatedAt` | `timestamptz` | Not null, set on insert |
| `UpdatedAt` | `timestamptz` | Not null, updated on every save |
| `DeletedAt` | `timestamptz` | Nullable — soft delete |

- Global EF Core query filter: `WHERE "DeletedAt" IS NULL` applied automatically on all queries
- All string columns use `character varying(n)` (PostgreSQL equivalent of SQL Server `nvarchar(n)`) — all text is UTF-8

---

## DTO: `ConfigDto`

File: `WeddingApi/Dtos/ConfigDto.cs`

Used for both request body (POST/PUT) and response body.

```json
{
  "id": 1,
  "key": "marry_date",
  "value": "2026-12-26",
  "type": "date",
  "createdAt": "2026-04-06T00:00:00Z",
  "updatedAt": "2026-04-06T00:00:00Z"
}
```

`DeletedAt` is not exposed in the response DTO (internal concern only).

---

## API Endpoints

Base path: `/api/configs`
All endpoints require `Authorization: Bearer <google_id_token>`.

| Method | Route | Description | Success | Error |
|---|---|---|---|---|
| `GET` | `/api/configs` | List all active configs | `200 [ConfigDto]` | — |
| `GET` | `/api/configs/{id}` | Get one active config | `200 ConfigDto` | `404` |
| `POST` | `/api/configs` | Create new config | `201 ConfigDto` | `400` |
| `PUT` | `/api/configs/{id}` | Update key/value/type | `200 ConfigDto` | `404`, `400` |
| `DELETE` | `/api/configs/{id}` | Soft delete (sets `DeletedAt`) | `204` | `404` |

---

## Authentication

- Package: `Microsoft.AspNetCore.Authentication.JwtBearer`
- Google's OpenID Connect discovery endpoint (`https://accounts.google.com/.well-known/openid-configuration`) provides signing keys automatically
- Token validation: `aud` must match Google Client ID
- Config:
  ```json
  // appsettings.json
  {
    "Authentication": {
      "Google": {
        "ClientId": ""
      }
    }
  }
  ```
- `ClientId` injected at runtime via env var `Authentication__Google__ClientId`
- `[Authorize]` applied at the `ConfigController` class level (all endpoints protected)

---

## Database

- Provider: `Npgsql.EntityFrameworkCore.PostgreSQL`
- Connection string env var: `ConnectionStrings__DefaultConnection` (Supabase PostgreSQL URL)
- Code-first migrations: `dotnet ef migrations add <Name>` / `dotnet ef database update`

---

## Tests

### Unit Tests (`WeddingApi.UnitTests`)

**Packages:** xUnit, Moq, `Microsoft.AspNetCore.Mvc.Testing`

**Strategy:** Mock `IConfigService`, test `ConfigController` in isolation — no DB, no HTTP.

**Cases:**
- `GetAll` → returns `200` with list from service
- `GetById` (exists) → returns `200` with dto
- `GetById` (missing) → returns `404`
- `Create` → returns `201` with created dto
- `Update` (exists) → returns `200` with updated dto
- `Update` (missing) → returns `404`
- `Delete` (exists) → returns `204`
- `Delete` (missing) → returns `404`

### Integration Tests (`WeddingApi.IntegrationTests`)

**Packages:** xUnit, `Microsoft.AspNetCore.Mvc.Testing`, `Testcontainers.PostgreSql`

**Strategy:** `WebApplicationFactory` boots the real API. Testcontainers spins up a PostgreSQL Docker container. EF Core migrations run before tests. Auth middleware replaced with a test scheme that auto-authenticates all requests.

**Cases:**
- `POST /api/configs` → creates entry, returns `201`
- `GET /api/configs` → returns the created entry
- `GET /api/configs/{id}` → returns correct entry
- `PUT /api/configs/{id}` → updates and returns `200`
- `DELETE /api/configs/{id}` → returns `204`, subsequent `GET` returns `404`

---

## Out of Scope (this sub-project)

- Next.js `/admin` page (Phase 3b)
- CI/CD pipelines (Phase 3c)
- RSVP, guestbook, photo gallery (Phase 4)
- Any endpoints beyond Config CRUD
