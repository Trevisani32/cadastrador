package com.trevisani.cadastrador.dto;

import com.trevisani.cadastrador.domain.Genero;
import com.trevisani.cadastrador.domain.TipoPessoa;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ClienteResponse(
        Long id,
        String nome,
        TipoPessoa tipoPessoa,
        Genero genero,
        LocalDate dataNascimento,
        String observacoes,
        boolean ativo,
        List<EnderecoDto> enderecos,
        List<ContatoDto> contatos,
        List<ParentescoDto> parentescos,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
