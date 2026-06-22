package com.trevisani.cadastrador.service;

import com.trevisani.cadastrador.domain.Cliente;
import com.trevisani.cadastrador.domain.Parentesco;
import com.trevisani.cadastrador.domain.TipoPessoa;
import com.trevisani.cadastrador.dto.ClienteRequest;
import com.trevisani.cadastrador.dto.ClienteResponse;
import com.trevisani.cadastrador.dto.ParentescoDto;
import com.trevisani.cadastrador.exception.RecursoNaoEncontradoException;
import com.trevisani.cadastrador.exception.RegraNegocioException;
import com.trevisani.cadastrador.repository.ClienteRepository;
import com.trevisani.cadastrador.repository.ParentescoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository repository;
    private final ParentescoRepository parentescoRepository;
    private final ClienteMapper mapper;

    public ClienteService(ClienteRepository repository, ParentescoRepository parentescoRepository,
                          ClienteMapper mapper) {
        this.repository = repository;
        this.parentescoRepository = parentescoRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Page<ClienteResponse> listar(String termo, TipoPessoa tipoPessoa, String bairro, Pageable pageable) {
        return repository.buscar(termo, tipoPessoa, bairro, pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> listarBairros() {
        return repository.listarBairros();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return mapper.toResponse(obter(id));
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest req) {
        Cliente cliente = new Cliente();
        mapper.aplicarDadosBasicos(req, cliente);
        aplicarParentescos(req.parentescos(), cliente);
        validarPrincipais(cliente);
        return mapper.toResponse(repository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest req) {
        Cliente cliente = obter(id);
        mapper.aplicarDadosBasicos(req, cliente);
        aplicarParentescos(req.parentescos(), cliente);
        validarPrincipais(cliente);
        return mapper.toResponse(repository.save(cliente));
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = obter(id);
        // Remove vínculos em que este cliente é citado como parente de outros
        parentescoRepository.removerReferenciasAoParente(id);
        repository.delete(cliente);
    }

    private Cliente obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado: " + id));
    }

    private void aplicarParentescos(List<ParentescoDto> dtos, Cliente cliente) {
        cliente.limparParentescos();
        for (ParentescoDto dto : dtos) {
            if (cliente.getId() != null && dto.parenteId().equals(cliente.getId())) {
                throw new RegraNegocioException("Um cliente não pode ter vínculo de parentesco com ele mesmo");
            }
            Cliente parente = repository.findById(dto.parenteId())
                    .orElseThrow(() -> new RegraNegocioException(
                            "Cliente do vínculo de parentesco não encontrado: " + dto.parenteId()));
            Parentesco p = new Parentesco();
            p.setParente(parente);
            p.setTipo(dto.tipo());
            p.setDescricao(dto.tipo() == com.trevisani.cadastrador.domain.TipoParentesco.OUTRO ? dto.descricao() : null);
            cliente.adicionarParentesco(p);
        }
    }

    /** Garante no máximo um endereço e um contato marcados como principal. */
    private void validarPrincipais(Cliente cliente) {
        long endsPrincipais = cliente.getEnderecos().stream().filter(e -> e.isPrincipal()).count();
        if (endsPrincipais > 1) {
            throw new RegraNegocioException("Apenas um endereço pode ser marcado como principal");
        }
        long contatosPrincipais = cliente.getContatos().stream().filter(c -> c.isPrincipal()).count();
        if (contatosPrincipais > 1) {
            throw new RegraNegocioException("Apenas um contato pode ser marcado como principal");
        }
    }
}
