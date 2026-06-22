package com.trevisani.cadastrador.dto;

import com.trevisani.cadastrador.domain.Genero;
import com.trevisani.cadastrador.domain.TipoPessoa;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public record ClienteRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 150)
        String nome,

        @NotNull(message = "O tipo de pessoa é obrigatório")
        TipoPessoa tipoPessoa,

        Genero genero,

        LocalDate dataNascimento,

        @Size(max = 1000)
        String observacoes,

        Boolean ativo,

        @Valid
        List<EnderecoDto> enderecos,

        @Valid
        List<ContatoDto> contatos,

        @Valid
        List<ParentescoDto> parentescos
) {
    public List<EnderecoDto> enderecos() {
        return enderecos == null ? new ArrayList<>() : enderecos;
    }

    public List<ContatoDto> contatos() {
        return contatos == null ? new ArrayList<>() : contatos;
    }

    public List<ParentescoDto> parentescos() {
        return parentescos == null ? new ArrayList<>() : parentescos;
    }
}
