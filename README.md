# Cadastrador de Clientes

Sistema completo de cadastro de clientes com **endereços**, **formas de contato** e **informações básicas**, com autenticação por JWT.

- **Backend:** Java 21 + Spring Boot 3.4 (Spring Web, Data JPA, Security, Validation)
- **Frontend:** Angular 21 (standalone components + signals)
- **Banco:** H2 em arquivo (criado automaticamente, sem instalação)

> Projeto de **demonstração/portfólio**: roda na hora, sem instalar nem configurar banco de dados.

## 🔗 Demo online

**https://trevisani32.github.io/cadastrador/** — entre com **admin / admin123**

A versão online é o **frontend** rodando no GitHub Pages em *modo demonstração*: não há backend, as operações são atendidas por dados de exemplo guardados no próprio navegador (os dados resetam ao limpar o navegador). Para rodar o sistema completo (Spring Boot + Angular de verdade), siga as instruções abaixo.

---

## Pré-requisitos

- Java 21+ e Maven 3.9+
- Node.js 20+ e npm

## Como rodar

### 1. Backend (porta 8080)

```bash
cd backend
mvn spring-boot:run
```

Na primeira execução o banco H2 é criado em `backend/data/` e são semeados:
- Usuário administrador: **admin / admin123**
- 3 clientes de demonstração

> Para testar o fluxo de **recuperação de senha** sem servidor de e-mail, rode com
> `EXPOR_CODIGO_RECUPERACAO=true mvn spring-boot:run` — assim o código aparece na tela.
> Por padrão ele fica oculto (comportamento de produção). Ver [Segurança](#segurança).

### 2. Frontend (porta 4200)

```bash
cd frontend
npm install   # apenas na primeira vez
npm start
```

Acesse **http://localhost:4200** e entre com `admin` / `admin123` (ou crie uma conta nova).

---

## Funcionalidades

- Login e cadastro de usuários (JWT, senha com BCrypt) com mostrar/ocultar senha
- Recuperação de senha por código de 8 dígitos (em produção o código vai por e-mail; em modo demonstração pode ser exibido na tela — ver [Segurança](#segurança))
- Listagem de clientes com busca por nome, **filtros por tipo de pessoa e bairro** e paginação
- **Colunas configuráveis**: escolher quais aparecem e arrastar para reordenar (preferência salva no navegador)
- Cadastro, edição e exclusão de clientes
- Informações básicas: nome/razão social, tipo de pessoa, **gênero**, data, situação, observações
- Múltiplos **endereços** por cliente, com **busca automática de CEP** (API pública ViaCEP)
- Múltiplas **formas de contato** (e-mail, telefone, celular, outro) com validação e máscara conforme o tipo
- **Vínculos de parentesco** entre clientes (filho(a), cônjuge, pai, mãe e outro com descrição livre)
- Data de nascimento no formato brasileiro (dd/mm/aaaa)
- Validações no front e no back

---

## API

Base: `http://localhost:8080/api`

| Método | Rota                  | Descrição                                                       | Auth |
|--------|-----------------------|---------------------------------                                |------|
| POST   | `/auth/login`         | Autentica e retorna token                                       | Não  |
| POST   | `/auth/registrar`     | Cria usuário e retorna token                                    | Não  |
| POST   | `/auth/esqueci-senha` | Gera código de recuperação                                      | Não  |
| POST   | `/auth/redefinir-senha`| Redefine a senha com o código                                  | Não  |
| GET    | `/clientes`           | Lista (params: `termo`, `tipoPessoa`, `bairro`, `page`, `size`) | Sim  |
| GET    | `/clientes/bairros`   | Lista os bairros cadastrados                                    | Sim  |
| GET    | `/clientes/{id}`      | Detalha um cliente                                              | Sim  |
| POST   | `/clientes`           | Cria cliente                                                    | Sim  |
| PUT    | `/clientes/{id}`      | Atualiza cliente                                                | Sim  |
| DELETE | `/clientes/{id}`      | Exclui cliente                                                  | Sim (**ADMIN**) |

Envie o token em `Authorization: Bearer <token>`.

> O console web do H2 vem **desabilitado** por padrão (evita expor o banco sem senha).
> Para usá-lo localmente, rode o backend com `H2_CONSOLE_ENABLED=true` e acesse
> http://localhost:8080/h2-console (JDBC URL `jdbc:h2:file:./data/cadastrador`, usuário `sa`, sem senha).

---

## Segurança

As escolhas de segurança seguem boas práticas reais, mas com **defaults pensados para a demonstração** rodar sem nenhuma configuração. Tudo que é sensível pode ser endurecido por variável de ambiente.

**Autenticação e autorização**
- JWT **stateless** (sem sessão no servidor), assinado com HMAC-SHA256.
- Senhas armazenadas com **BCrypt** (hash + salt); nunca trafegam nem são retornadas.
- **Autorização por papel** com `@EnableMethodSecurity`: a exclusão de clientes (`DELETE`) exige `ROLE_ADMIN` (`@PreAuthorize("hasRole('ADMIN')")`). Usuários comuns recebem `403`.
- Filtro JWT valida assinatura e expiração a cada requisição; rotas sob `/api/**` (exceto `/api/auth/**`) exigem autenticação.

**Segredos e configuração externalizada**
- O segredo do JWT **não fica versionado**. Vem de `JWT_SECRET`; se ausente, o backend gera uma chave aleatória em memória apenas para desenvolvimento (e registra um aviso). Em produção, defina `JWT_SECRET`.
- Credenciais do admin semeado e demais parâmetros são externalizáveis (ver tabela abaixo).

**Fluxo de recuperação de senha**
- Respostas **anti-enumeração**: solicitar recuperação ou redefinir senha devolve sempre a mesma mensagem, sem revelar se o e-mail existe.
- O código de recuperação **nunca é retornado nem logado** por padrão. Para testar o fluxo localmente sem servidor de e-mail, habilite `EXPOR_CODIGO_RECUPERACAO=true` — em produção ele iria por e-mail.
- Código gerado com `SecureRandom`, com expiração de 15 minutos e marcação de uso único.

**Superfície de ataque**
- **CORS** restrito a origem (`http://localhost:4200`) e cabeçalhos explícitos (`Authorization`, `Content-Type`).
- **Console H2 desabilitado** por padrão (evita acesso ao banco sem senha).
- Erros internos (`500`) retornam mensagem genérica; o detalhe fica apenas no log do servidor.
- Consultas usam JPQL **parametrizada** (sem SQL injection); validação de entrada com Bean Validation (`@Valid`) no front e no back.
- O token JWT é anexado **apenas** a chamadas da própria API — serviços externos (ex.: ViaCEP) não recebem a credencial.

**Decisões conscientes de demonstração** (e como endureceria em produção)
- **Registro de usuário é público** — proposital, para o avaliador conseguir criar conta e testar. Em produção: fechar o auto-registro (criação só por admin) ou exigir aprovação.
- **Token JWT no `localStorage`** do navegador — simples para o demo; em produção, migraria para cookie `HttpOnly; Secure; SameSite` para mitigar XSS.
- **H2 em arquivo** — zero instalação para o demo; em produção, banco gerenciado (PostgreSQL) + migrações versionadas (Flyway/Liquibase) no lugar de `ddl-auto: update`.

### Variáveis de ambiente

Todas têm default de demonstração; defina-as para endurecer o ambiente.

| Variável                  | Default                  | Descrição |
|---------------------------|--------------------------|-----------|
| `JWT_SECRET`              | *(aleatório em memória)* | Chave Base64 (256 bits) para assinar o JWT. **Defina em produção.** |
| `EXPOR_CODIGO_RECUPERACAO`| `false`                  | Se `true`, expõe o código de recuperação na resposta/log (apenas dev). |
| `H2_CONSOLE_ENABLED`      | `false`                  | Habilita o console web do H2. |
| `ADMIN_USERNAME`          | `admin`                  | Usuário admin semeado na primeira execução. |
| `ADMIN_PASSWORD`          | `admin123`               | Senha do admin semeado. |
| `ADMIN_EMAIL`             | `admin@exemplo.com`      | E-mail do admin semeado. |

---

## Testes

A cobertura segue a **pirâmide de testes**: muitos testes rápidos na base, poucos E2E no topo.

| Camada                | Tecnologia                             | O que cobre                                    | Como rodar |
|--------               |-----------                             |-------------                                   |------------|
| **Unitário (back)**   | JUnit 5 + Mockito                      | Regras do `AuthService` e `JwtService`         | `cd backend && mvn test`|
| **Integração (back)** | Spring MVC Test + Spring Security Test | Autorização: `DELETE` só para `ROLE_ADMIN`, rotas exigem login    | `cd backend && mvn test`|
| **Unitário (front)**  | Vitest + Angular Testing               | `CepService` (timeout/erro 200) e `authInterceptor` (token não vaza p/ ViaCEP; 401 desloga, 403 não) | `cd frontend && npm test` |
| **E2E**               | Playwright                             | Fluxos reais no navegador: login, busca de CEP, e permissão de exclusão ponta a ponta | `cd e2e && npm install && npx playwright install chromium && npm test` |

Os testes E2E sobem **backend e frontend automaticamente** (ver `e2e/playwright.config.ts`) e mockam a ViaCEP para serem determinísticos. Vários testes nasceram de bugs reais encontrados durante a escrita — por exemplo, o teste de autorização revelou que uma negação de acesso retornava `500` em vez de `403`, e o E2E mostrou que um `403` deslogava o usuário indevidamente; ambos foram corrigidos.

---

## Estrutura

```
Cadastrador/
├── backend/    # API Spring Boot (com.trevisani.cadastrador)
├── frontend/   # SPA Angular
└── e2e/        # Testes end-to-end (Playwright)
```
