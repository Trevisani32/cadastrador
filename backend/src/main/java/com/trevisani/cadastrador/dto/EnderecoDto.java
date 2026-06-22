package com.trevisani.cadastrador.dto;

import com.trevisani.cadastrador.domain.TipoEndereco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnderecoDto(
        Long id,

        @NotNull(message = "O tipo do endereço é obrigatório")
        TipoEndereco tipo,

        @Size(max = 9, message = "CEP inválido")
        String cep,

        @NotBlank(message = "O logradouro é obrigatório")
        @Size(max = 150)
        String logradouro,

        @Size(max = 20)
        String numero,

        @Size(max = 100)
        String complemento,

        @Size(max = 100)
        String bairro,

        @NotBlank(message = "A cidade é obrigatória")
        @Size(max = 100)
        String cidade,

        @NotBlank(message = "O estado (UF) é obrigatório")
        @Size(min = 2, max = 2, message = "A UF deve ter 2 letras")
        String estado,

        boolean principal
) {
}
