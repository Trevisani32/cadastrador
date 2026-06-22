package com.trevisani.cadastrador.controller;

import com.trevisani.cadastrador.dto.*;
import com.trevisani.cadastrador.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/registrar")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.registrar(req));
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<RecuperacaoResponse> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest req) {
        return ResponseEntity.ok(authService.solicitarRecuperacao(req));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest req) {
        authService.redefinirSenha(req);
        return ResponseEntity.ok(Map.of("mensagem", "Senha redefinida com sucesso. Faça login com a nova senha."));
    }
}
