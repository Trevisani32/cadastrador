package com.trevisani.cadastrador.service;

import com.trevisani.cadastrador.domain.*;
import com.trevisani.cadastrador.dto.ClienteRequest;
import com.trevisani.cadastrador.dto.ClienteResponse;
import com.trevisani.cadastrador.dto.ContatoDto;
import com.trevisani.cadastrador.dto.EnderecoDto;
import com.trevisani.cadastrador.dto.ParentescoDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ClienteMapper {

    public ClienteResponse toResponse(Cliente c) {
        List<EnderecoDto> enderecos = c.getEnderecos().stream()
                .map(this::toEnderecoDto)
                .toList();
        List<ContatoDto> contatos = c.getContatos().stream()
                .map(this::toContatoDto)
                .toList();
        List<ParentescoDto> parentescos = c.getParentescos().stream()
                .map(this::toParentescoDto)
                .toList();
        return new ClienteResponse(
                c.getId(),
                c.getNome(),
                c.getTipoPessoa(),
                c.getGenero(),
                c.getDataNascimento(),
                c.getObservacoes(),
                c.isAtivo(),
                enderecos,
                contatos,
                parentescos,
                c.getCriadoEm(),
                c.getAtualizadoEm()
        );
    }

    private EnderecoDto toEnderecoDto(Endereco e) {
        return new EnderecoDto(
                e.getId(), e.getTipo(), e.getCep(), e.getLogradouro(), e.getNumero(),
                e.getComplemento(), e.getBairro(), e.getCidade(), e.getEstado(), e.isPrincipal()
        );
    }

    private ContatoDto toContatoDto(Contato c) {
        return new ContatoDto(c.getId(), c.getTipo(), c.getValor(), c.getDescricao(), c.isPrincipal());
    }

    private ParentescoDto toParentescoDto(Parentesco p) {
        return new ParentescoDto(p.getId(), p.getParente().getId(), p.getParente().getNome(),
                p.getTipo(), p.getDescricao());
    }

    /**
     * Aplica os dados básicos, endereços e contatos na entidade.
     * Parentescos são tratados no {@link ClienteService} pois exigem buscar outros clientes.
     */
    public void aplicarDadosBasicos(ClienteRequest req, Cliente cliente) {
        cliente.setNome(req.nome());
        cliente.setTipoPessoa(req.tipoPessoa());
        cliente.setGenero(req.genero() == null ? Genero.NAO_INFORMADO : req.genero());
        cliente.setDataNascimento(req.dataNascimento());
        cliente.setObservacoes(req.observacoes());
        cliente.setAtivo(req.ativo() == null ? true : req.ativo());

        cliente.limparEnderecos();
        for (EnderecoDto dto : req.enderecos()) {
            cliente.adicionarEndereco(toEndereco(dto));
        }

        cliente.limparContatos();
        for (ContatoDto dto : req.contatos()) {
            cliente.adicionarContato(toContato(dto));
        }
    }

    private Endereco toEndereco(EnderecoDto dto) {
        Endereco e = new Endereco();
        e.setTipo(dto.tipo());
        e.setCep(dto.cep());
        e.setLogradouro(dto.logradouro());
        e.setNumero(dto.numero());
        e.setComplemento(dto.complemento());
        e.setBairro(dto.bairro());
        e.setCidade(dto.cidade());
        e.setEstado(dto.estado() == null ? null : dto.estado().toUpperCase());
        e.setPrincipal(dto.principal());
        return e;
    }

    private Contato toContato(ContatoDto dto) {
        Contato c = new Contato();
        c.setTipo(dto.tipo());
        c.setValor(dto.valor());
        c.setDescricao(dto.descricao());
        c.setPrincipal(dto.principal());
        return c;
    }
}
