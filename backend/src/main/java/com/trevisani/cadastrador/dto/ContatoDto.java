package com.trevisani.cadastrador.dto;

import com.trevisani.cadastrador.domain.TipoContato;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ContatoDto(
        Long id,

        @NotNull(message = "O tipo do contato é obrigatório")
        TipoContato tipo,

        @NotBlank(message = "O valor do contato é obrigatório")
        @Size(max = 150)
        String valor,

        @Size(max = 100)
        String descricao,

        boolean principal
) {
}
