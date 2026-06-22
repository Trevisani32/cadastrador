package com.trevisani.cadastrador.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(
        @NotBlank(message = "Informe o e-mail")
        @Email(message = "Informe um e-mail válido")
        String email,

        @NotBlank(message = "Informe o código de verificação")
        @Size(min = 8, max = 8, message = "O código deve ter 8 dígitos")
        String codigo,

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 6, max = 100, message = "A senha deve ter no mínimo 6 caracteres")
        String novaSenha
) {
}
