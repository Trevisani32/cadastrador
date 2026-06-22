package com.trevisani.cadastrador.config;

import com.trevisani.cadastrador.domain.*;
import com.trevisani.cadastrador.repository.ClienteRepository;
import com.trevisani.cadastrador.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.seed-demo-data:false}")
    private boolean seedDemo;

    public DataInitializer(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        criarAdmin();
        if (seedDemo) {
            criarClientesDemo();
        }
    }

    private void criarAdmin() {
        if (!usuarioRepository.existsByUsername(adminUsername)) {
            Usuario admin = new Usuario(
                    "Administrador",
                    adminUsername,
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    Role.ROLE_ADMIN
            );
            usuarioRepository.save(admin);
        }
    }

    private void criarClientesDemo() {
        if (clienteRepository.count() > 0) {
            return;
        }

        Cliente maria = new Cliente();
        maria.setNome("Maria Oliveira Santos");
        maria.setTipoPessoa(TipoPessoa.FISICA);
        maria.setGenero(Genero.FEMININO);
        maria.setDataNascimento(LocalDate.of(1990, 5, 14));
        maria.setObservacoes("Cliente desde 2021.");
        maria.adicionarEndereco(endereco(TipoEndereco.RESIDENCIAL, "13010-001", "Rua das Flores", "123",
                "Apto 45", "Centro", "Campinas", "SP", true));
        maria.adicionarContato(contato(TipoContato.CELULAR, "(19) 99999-1234", "Pessoal", true));
        maria.adicionarContato(contato(TipoContato.EMAIL, "maria.santos@email.com", null, false));
        maria = clienteRepository.save(maria);

        Cliente tech = new Cliente();
        tech.setNome("Tech Solutions LTDA");
        tech.setTipoPessoa(TipoPessoa.JURIDICA);
        tech.setGenero(Genero.NAO_INFORMADO);
        tech.setObservacoes("Contrato anual de suporte.");
        tech.adicionarEndereco(endereco(TipoEndereco.COMERCIAL, "01310-100", "Av. Paulista", "1000",
                "Sala 1502", "Bela Vista", "São Paulo", "SP", true));
        tech.adicionarContato(contato(TipoContato.TELEFONE, "(11) 3333-4444", "Comercial", true));
        tech.adicionarContato(contato(TipoContato.EMAIL, "contato@techsolutions.com.br", "Financeiro", false));
        clienteRepository.save(tech);

        Cliente joao = new Cliente();
        joao.setNome("João Pereira");
        joao.setTipoPessoa(TipoPessoa.FISICA);
        joao.setGenero(Genero.MASCULINO);
        joao.setDataNascimento(LocalDate.of(1985, 11, 2));
        joao.adicionarEndereco(endereco(TipoEndereco.RESIDENCIAL, "30130-010", "Rua da Bahia", "500",
                null, "Lourdes", "Belo Horizonte", "MG", true));
        joao.adicionarContato(contato(TipoContato.CELULAR, "(31) 98888-7777", null, true));
        // Exemplo de vínculo de parentesco: Maria é cônjuge de João
        Parentesco vinculo = new Parentesco();
        vinculo.setParente(maria);
        vinculo.setTipo(TipoParentesco.CONJUGE);
        joao.adicionarParentesco(vinculo);
        clienteRepository.save(joao);
    }

    private Endereco endereco(TipoEndereco tipo, String cep, String logradouro, String numero,
                              String complemento, String bairro, String cidade, String uf, boolean principal) {
        Endereco e = new Endereco();
        e.setTipo(tipo);
        e.setCep(cep);
        e.setLogradouro(logradouro);
        e.setNumero(numero);
        e.setComplemento(complemento);
        e.setBairro(bairro);
        e.setCidade(cidade);
        e.setEstado(uf);
        e.setPrincipal(principal);
        return e;
    }

    private Contato contato(TipoContato tipo, String valor, String descricao, boolean principal) {
        Contato c = new Contato();
        c.setTipo(tipo);
        c.setValor(valor);
        c.setDescricao(descricao);
        c.setPrincipal(principal);
        return c;
    }
}
