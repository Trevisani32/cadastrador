package com.trevisani.cadastrador.dto;

public record AuthResponse(
        String token,
        String tipo,
        String username,
        String nome,
        String role
) {
    public static AuthResponse bearer(String token, String username, String nome, String role) {
        return new AuthResponse(token, "Bearer", username, nome, role);
    }
}
