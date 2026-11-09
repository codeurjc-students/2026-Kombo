package es.urjc.kombo.dto;

// Body of POST /api/v1/auth/login
public record LoginRequestDTO(String email, String password) {
}
