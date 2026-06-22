import { Injectable } from '@angular/core';
import { Cliente, Page } from '../models/cliente.model';
import { AuthResponse } from '../models/auth.model';

interface DemoUsuario {
  nome: string;
  username: string;
  email: string;
  senha: string;
  role: string;
}

const K_CLIENTES = 'cadastrador.demo.clientes';
const K_USUARIOS = 'cadastrador.demo.usuarios';
const K_SEQ = 'cadastrador.demo.seq';
const K_CODIGOS = 'cadastrador.demo.codigos';

/**
 * Armazém de dados em memória/localStorage usado APENAS no modo demonstração
 * (GitHub Pages), substituindo o backend real. Reproduz o comportamento da API.
 */
@Injectable({ providedIn: 'root' })
export class DemoStore {
  constructor() {
    this.semear();
  }

  // ----- Autenticação -----

  login(username: string, senha: string): AuthResponse {
    const u = this.usuarios().find((x) => x.username === username && x.senha === senha);
    if (!u) {
      throw this.erro(401, 'Usuário ou senha inválidos');
    }
    return this.authResponse(u);
  }

  registrar(nome: string, username: string, email: string, senha: string): AuthResponse {
    const usuarios = this.usuarios();
    if (usuarios.some((u) => u.username === username)) {
      throw this.erro(400, 'Nome de usuário já está em uso');
    }
    if (usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw this.erro(400, 'E-mail já está em uso');
    }
    const novo: DemoUsuario = { nome, username, email, senha, role: 'ROLE_USER' };
    usuarios.push(novo);
    this.set(K_USUARIOS, usuarios);
    return this.authResponse(novo);
  }

  esqueciSenha(email: string): { mensagem: string; demo: boolean; codigoDemo: string | null } {
    const u = this.usuarios().find((x) => x.email.toLowerCase() === email.toLowerCase());
    const generica = 'Se houver uma conta associada a esse e-mail, enviaremos as instruções de recuperação.';
    if (!u) {
      // Mesma resposta (anti-enumeração), mas no modo demo seguimos expondo o código quando existe.
      return { mensagem: generica, demo: false, codigoDemo: null };
    }
    const codigo = String(Math.floor(10000000 + this.pseudoRandom() * 90000000));
    const codigos = this.get<Record<string, string>>(K_CODIGOS, {});
    codigos[u.username] = codigo;
    this.set(K_CODIGOS, codigos);
    return { mensagem: 'Código de verificação gerado (modo demonstração).', demo: true, codigoDemo: codigo };
  }

  redefinirSenha(email: string, codigo: string, novaSenha: string): void {
    const usuarios = this.usuarios();
    const u = usuarios.find((x) => x.email.toLowerCase() === email.toLowerCase());
    const codigos = this.get<Record<string, string>>(K_CODIGOS, {});
    if (!u || codigos[u.username] !== codigo) {
      throw this.erro(400, 'Código de verificação inválido ou expirado.');
    }
    u.senha = novaSenha;
    this.set(K_USUARIOS, usuarios);
    delete codigos[u.username];
    this.set(K_CODIGOS, codigos);
  }

  // ----- Clientes -----

  listar(termo: string, tipoPessoa: string, bairro: string, page: number, size: number): Page<Cliente> {
    let lista = this.clientes();
    const t = (termo || '').toLowerCase();
    if (t) {
      lista = lista.filter((c) => c.nome.toLowerCase().includes(t));
    }
    if (tipoPessoa) {
      lista = lista.filter((c) => c.tipoPessoa === tipoPessoa);
    }
    if (bairro) {
      const b = bairro.toLowerCase();
      lista = lista.filter((c) => (c.enderecos || []).some((e) => (e.bairro || '').toLowerCase().includes(b)));
    }
    lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    const totalElements = lista.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const inicio = page * size;
    const content = lista.slice(inicio, inicio + size).map((c) => this.comParenteNome(c));
    return {
      content,
      totalElements,
      totalPages,
      number: page,
      size,
      first: page === 0,
      last: page >= totalPages - 1
    };
  }

  bairros(): string[] {
    const set = new Set<string>();
    this.clientes().forEach((c) => (c.enderecos || []).forEach((e) => {
      if (e.bairro) {
        set.add(e.bairro);
      }
    }));
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  buscar(id: number): Cliente {
    const c = this.clientes().find((x) => x.id === id);
    if (!c) {
      throw this.erro(404, 'Cliente não encontrado: ' + id);
    }
    return this.comParenteNome(c);
  }

  criar(dados: Cliente): Cliente {
    const lista = this.clientes();
    const novo: Cliente = { ...dados, id: this.proximoId() };
    this.normalizarPrincipais(novo);
    lista.push(novo);
    this.set(K_CLIENTES, lista);
    return this.comParenteNome(novo);
  }

  atualizar(id: number, dados: Cliente): Cliente {
    const lista = this.clientes();
    const i = lista.findIndex((x) => x.id === id);
    if (i < 0) {
      throw this.erro(404, 'Cliente não encontrado: ' + id);
    }
    const atualizado: Cliente = { ...dados, id };
    this.normalizarPrincipais(atualizado);
    lista[i] = atualizado;
    this.set(K_CLIENTES, lista);
    return this.comParenteNome(atualizado);
  }

  excluir(id: number): void {
    let lista = this.clientes();
    lista = lista.filter((x) => x.id !== id);
    // Remove vínculos que apontavam para o cliente excluído
    lista.forEach((c) => {
      c.parentescos = (c.parentescos || []).filter((p) => p.parenteId !== id);
    });
    this.set(K_CLIENTES, lista);
  }

  // ----- Internos -----

  private comParenteNome(c: Cliente): Cliente {
    const todos = this.clientes();
    return {
      ...c,
      parentescos: (c.parentescos || []).map((p) => ({
        ...p,
        parenteNome: todos.find((x) => x.id === p.parenteId)?.nome ?? '—'
      }))
    };
  }

  private normalizarPrincipais(c: Cliente): void {
    c.genero = c.genero || 'NAO_INFORMADO';
    c.enderecos = c.enderecos || [];
    c.contatos = c.contatos || [];
    c.parentescos = c.parentescos || [];
  }

  private authResponse(u: DemoUsuario): AuthResponse {
    return {
      token: 'demo.' + btoa(u.username + ':' + Date.now()),
      tipo: 'Bearer',
      username: u.username,
      nome: u.nome,
      role: u.role
    };
  }

  private clientes(): Cliente[] {
    return this.get<Cliente[]>(K_CLIENTES, []);
  }

  private usuarios(): DemoUsuario[] {
    return this.get<DemoUsuario[]>(K_USUARIOS, []);
  }

  private proximoId(): number {
    const atual = this.get<number>(K_SEQ, 100);
    const proximo = atual + 1;
    this.set(K_SEQ, proximo);
    return proximo;
  }

  private pseudoRandom(): number {
    // Evita Math.random direto para variar; suficiente para um código de demonstração.
    return (Date.now() % 1000) / 1000 + Math.random();
  }

  private erro(status: number, mensagem: string) {
    return { status, error: { mensagem } };
  }

  private get<T>(chave: string, padrao: T): T {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? (JSON.parse(bruto) as T) : padrao;
    } catch {
      return padrao;
    }
  }

  private set(chave: string, valor: unknown): void {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  private semear(): void {
    if (localStorage.getItem(K_USUARIOS)) {
      return;
    }
    this.set(K_USUARIOS, [
      { nome: 'Administrador', username: 'admin', email: 'admin@exemplo.com', senha: 'admin123', role: 'ROLE_ADMIN' }
    ]);
    this.set(K_SEQ, 3);
    const agora = new Date().toISOString();
    const clientes: Cliente[] = [
      {
        id: 1, nome: 'Maria Oliveira Santos', tipoPessoa: 'FISICA', genero: 'FEMININO',
        dataNascimento: '1990-05-14', observacoes: 'Cliente desde 2021.', ativo: true,
        enderecos: [{ tipo: 'RESIDENCIAL', cep: '13010-001', logradouro: 'Rua das Flores', numero: '123', complemento: 'Apto 45', bairro: 'Centro', cidade: 'Campinas', estado: 'SP', principal: true }],
        contatos: [
          { tipo: 'CELULAR', valor: '(19) 99999-1234', descricao: 'Pessoal', principal: true },
          { tipo: 'EMAIL', valor: 'maria.santos@email.com', principal: false }
        ],
        parentescos: [], criadoEm: agora, atualizadoEm: agora
      },
      {
        id: 2, nome: 'Tech Solutions LTDA', tipoPessoa: 'JURIDICA', genero: 'NAO_INFORMADO',
        observacoes: 'Contrato anual de suporte.', ativo: true,
        enderecos: [{ tipo: 'COMERCIAL', cep: '01310-100', logradouro: 'Av. Paulista', numero: '1000', complemento: 'Sala 1502', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', principal: true }],
        contatos: [
          { tipo: 'TELEFONE', valor: '(11) 3333-4444', descricao: 'Comercial', principal: true },
          { tipo: 'EMAIL', valor: 'contato@techsolutions.com.br', descricao: 'Financeiro', principal: false }
        ],
        parentescos: [], criadoEm: agora, atualizadoEm: agora
      },
      {
        id: 3, nome: 'João Pereira', tipoPessoa: 'FISICA', genero: 'MASCULINO',
        dataNascimento: '1985-11-02', ativo: true,
        enderecos: [{ tipo: 'RESIDENCIAL', cep: '30130-010', logradouro: 'Rua da Bahia', numero: '500', bairro: 'Lourdes', cidade: 'Belo Horizonte', estado: 'MG', principal: true }],
        contatos: [{ tipo: 'CELULAR', valor: '(31) 98888-7777', principal: true }],
        parentescos: [{ parenteId: 1, tipo: 'CONJUGE' }], criadoEm: agora, atualizadoEm: agora
      }
    ];
    this.set(K_CLIENTES, clientes);
  }
}
