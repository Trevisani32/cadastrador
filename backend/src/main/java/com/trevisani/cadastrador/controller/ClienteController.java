package com.trevisani.cadastrador.controller;

import com.trevisani.cadastrador.domain.TipoPessoa;
import com.trevisani.cadastrador.dto.ClienteRequest;
import com.trevisani.cadastrador.dto.ClienteResponse;
import com.trevisani.cadastrador.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    @GetMapping
    public Page<ClienteResponse> listar(
            @RequestParam(required = false, defaultValue = "") String termo,
            @RequestParam(required = false) TipoPessoa tipoPessoa,
            @RequestParam(required = false, defaultValue = "") String bairro,
            @PageableDefault(size = 10, sort = "nome") Pageable pageable) {
        return service.listar(termo, tipoPessoa, bairro, pageable);
    }

    @GetMapping("/bairros")
    public List<String> bairros() {
        return service.listarBairros();
    }

    @GetMapping("/{id}")
    public ClienteResponse buscar(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> criar(@Valid @RequestBody ClienteRequest req) {
        ClienteResponse criado = service.criar(req);
        return ResponseEntity.created(URI.create("/api/clientes/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    public ClienteResponse atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
