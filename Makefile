.PHONY: web api dev stop

# Run Next.js dev server
web:
	cd web && npm run dev

# Run .NET API
api:
	cd api/WeddingApi && dotnet run

# Run both in parallel
dev:
	make -j2 web api

# Kill both servers
stop:
	@lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "Stopped web (3000)" || echo "Web not running"
	@lsof -ti:5073 | xargs kill -9 2>/dev/null && echo "Stopped API (5073)" || echo "API not running"
