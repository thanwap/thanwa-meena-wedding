using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class ConfigService : IConfigService
{
    private readonly AppDbContext _db;

    public ConfigService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ConfigDto>> GetAllAsync() =>
        await _db.Configs
            .Select(c => ToDto(c))
            .ToListAsync();

    public async Task<ConfigDto?> GetByIdAsync(int id)
    {
        var config = await _db.Configs.FirstOrDefaultAsync(c => c.Id == id);
        return config is null ? null : ToDto(config);
    }

    public async Task<ConfigDto> CreateAsync(ConfigRequest request)
    {
        var now = DateTime.UtcNow;
        var config = new Config
        {
            Key = request.Key,
            Value = request.Value,
            Type = request.Type,
            CreatedAt = now,
            UpdatedAt = now
        };
        _db.Configs.Add(config);
        await _db.SaveChangesAsync();
        return ToDto(config);
    }

    public async Task<ConfigDto?> UpdateAsync(int id, ConfigRequest request)
    {
        var config = await _db.Configs.FirstOrDefaultAsync(c => c.Id == id);
        if (config is null) return null;

        config.Key = request.Key;
        config.Value = request.Value;
        config.Type = request.Type;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(config);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var config = await _db.Configs.FirstOrDefaultAsync(c => c.Id == id);
        if (config is null) return false;

        config.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static ConfigDto ToDto(Config c) =>
        new(c.Id, c.Key, c.Value, c.Type, c.CreatedAt, c.UpdatedAt);
}
