.PHONY: web api dev stop db db-stop db-migrate

LOCAL_DB_URL=Host=localhost;Port=5433;Database=wedding;Username=wedding;Password=wedding

# Run Next.js dev server
web:
	cd web && npm run dev

# Start local Postgres (Docker)
db:
	docker compose up -d db
	@echo "Waiting for Postgres to be ready..."
	@until docker compose exec db pg_isready -U wedding -d wedding -q 2>/dev/null; do sleep 1; done
	@echo "Postgres ready."

# Apply EF migrations and seed default admin accounts against local Docker DB
db-migrate: db
	cd api/WeddingApi && DESIGN_TIME_DB="$(LOCAL_DB_URL)" dotnet ef database update
	cd api/WeddingApi && ConnectionStrings__DefaultConnection="$(LOCAL_DB_URL)" SEED_PASSWORD="P@ssw0rd_Admin" dotnet run -- seed-admins 2>/dev/null

# Run .NET API against local Docker DB
api: db
	cd api/WeddingApi && ConnectionStrings__DefaultConnection="$(LOCAL_DB_URL)" dotnet run

# Run both in parallel
dev:
	make -j2 web api

# Kill both servers (keeps Docker DB running)
stop:
	@lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "Stopped web (3000)" || echo "Web not running"
	@lsof -ti:5073 | xargs kill -9 2>/dev/null && echo "Stopped API (5073)" || echo "API not running"

# Stop and remove local Docker DB
db-stop:
	docker compose down
