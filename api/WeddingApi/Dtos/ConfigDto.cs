namespace WeddingApi.Dtos;

/// <summary>Response shape returned by all endpoints.</summary>
public record ConfigDto(
    int Id,
    string Key,
    string Value,
    string Type,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Request body for POST and PUT.</summary>
public record ConfigRequest(string Key, string Value, string Type);
