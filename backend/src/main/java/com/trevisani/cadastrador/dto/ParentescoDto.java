package com.trevisani.cadastrador.dto;

import com.trevisani.cadastrador.domain.TipoParentesco;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ParentescoDto(
        Long id,

        @NotNull(message = "Selecione o cliente do vínculo")
        Long parenteId,

        // Preenchido apenas nas respostas
        String parenteNome,

        @NotNull(message = "Informe o tipo de parentesco")
        TipoParentesco tipo,

        // Usado quando o tipo é OUTRO
        @Size(max = 100)
        String descricao
) {
}
