import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConfirmacaoService } from '../../../core/services/confirmacao.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { Cliente, GENEROS, TipoPessoa } from '../../../core/models/cliente.model';

interface Coluna {
  chave: string;
  rotulo: string;
  visivel: boolean;
}

const COLUNAS_PADRAO: Coluna[] = [
  { chave: 'nome', rotulo: 'Nome', visivel: true },
  { chave: 'tipo', rotulo: 'Tipo', visivel: true },
  { chave: 'genero', rotulo: 'Gênero', visivel: false },
  { chave: 'contato', rotulo: 'Contato', visivel: true },
  { chave: 'cidade', rotulo: 'Cidade', visivel: true },
  { chave: 'bairro', rotulo: 'Bairro', visivel: false },
  { chave: 'status', rotulo: 'Status', visivel: true }
];

const STORAGE_COLUNAS = 'cadastrador.colunas';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink, FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.scss'
})
export class ClienteList implements OnInit {
  private service = inject(ClienteService);
  private router = inject(Router);
  private confirmacao = inject(ConfirmacaoService);
  private notificacao = inject(NotificacaoService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly termo = signal('');
  protected readonly filtroTipo = signal<TipoPessoa | ''>('');
  protected readonly filtroBairro = signal('');
  protected readonly bairros = signal<string[]>([]);

  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly totalElementos = signal(0);

  protected readonly colunas = signal<Coluna[]>(this.carregarColunas());
  protected readonly painelColunas = signal(false);
  protected readonly colunasVisiveis = computed(() => this.colunas().filter((c) => c.visivel));

  private debounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.carregar();
    this.service.listarBairros().subscribe({ next: (b) => this.bairros.set(b) });
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.service
      .listar({
        termo: this.termo(),
        tipoPessoa: this.filtroTipo(),
        bairro: this.filtroBairro(),
        pagina: this.pagina(),
        tamanho: 10
      })
      .subscribe({
        next: (page) => {
          this.clientes.set(page.content);
          this.totalPaginas.set(page.totalPages);
          this.totalElementos.set(page.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os clientes.');
          this.carregando.set(false);
        }
      });
  }

  aoBuscar(valor: string): void {
    this.termo.set(valor);
    this.pagina.set(0);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.carregar(), 350);
  }

  aplicarFiltros(): void {
    this.pagina.set(0);
    this.carregar();
  }

  limparFiltros(): void {
    this.termo.set('');
    this.filtroTipo.set('');
    this.filtroBairro.set('');
    this.pagina.set(0);
    this.carregar();
  }

  irPara(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) {
      return;
    }
    this.pagina.set(pagina);
    this.carregar();
  }

  // ----- Colunas -----

  alternarPainelColunas(): void {
    this.painelColunas.update((v) => !v);
  }

  alternarColuna(chave: string): void {
    this.colunas.update((cols) =>
      cols.map((c) => (c.chave === chave ? { ...c, visivel: !c.visivel } : c))
    );
    this.salvarColunas();
  }

  soltarColuna(evento: CdkDragDrop<Coluna[]>): void {
    const cols = [...this.colunas()];
    moveItemInArray(cols, evento.previousIndex, evento.currentIndex);
    this.colunas.set(cols);
    this.salvarColunas();
  }

  restaurarColunas(): void {
    this.colunas.set(COLUNAS_PADRAO.map((c) => ({ ...c })));
    this.salvarColunas();
  }

  private salvarColunas(): void {
    localStorage.setItem(STORAGE_COLUNAS, JSON.stringify(this.colunas()));
  }

  private carregarColunas(): Coluna[] {
    const bruto = localStorage.getItem(STORAGE_COLUNAS);
    if (!bruto) {
      return COLUNAS_PADRAO.map((c) => ({ ...c }));
    }
    try {
      const salvas = JSON.parse(bruto) as Coluna[];
      // Reconcilia com as colunas padrão (preserva ordem/visibilidade salvas, adiciona novas ao final)
      const resultado: Coluna[] = [];
      for (const s of salvas) {
        const padrao = COLUNAS_PADRAO.find((p) => p.chave === s.chave);
        if (padrao) {
          resultado.push({ chave: padrao.chave, rotulo: padrao.rotulo, visivel: s.visivel });
        }
      }
      for (const p of COLUNAS_PADRAO) {
        if (!resultado.some((r) => r.chave === p.chave)) {
          resultado.push({ ...p });
        }
      }
      return resultado;
    } catch {
      return COLUNAS_PADRAO.map((c) => ({ ...c }));
    }
  }

  // ----- Ações -----

  editar(cliente: Cliente): void {
    this.router.navigate(['/clientes', cliente.id]);
  }

  async excluir(cliente: Cliente): Promise<void> {
    if (!cliente.id) {
      return;
    }
    const confirmado = await this.confirmacao.perguntar({
      titulo: 'Excluir cliente',
      mensagem: `Tem certeza que deseja excluir "${cliente.nome}"? Esta ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      perigo: true
    });
    if (!confirmado) {
      return;
    }
    this.service.excluir(cliente.id).subscribe({
      next: () => {
        this.notificacao.sucesso(`Cliente "${cliente.nome}" excluído com sucesso.`);
        this.carregar();
      },
      error: () => this.notificacao.erro('Não foi possível excluir o cliente.')
    });
  }

  // ----- Valores das células -----

  contatoPrincipal(c: Cliente): string {
    const p = c.contatos?.find((x) => x.principal) ?? c.contatos?.[0];
    if (!p) {
      return '—';
    }
    if (p.tipo === 'TELEFONE' || p.tipo === 'CELULAR') {
      return this.formatarTelefone(p.valor);
    }
    return p.valor;
  }

  private formatarTelefone(valor: string): string {
    const d = (valor ?? '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return valor;
  }

  cidadePrincipal(c: Cliente): string {
    const e = c.enderecos?.find((x) => x.principal) ?? c.enderecos?.[0];
    return e ? `${e.cidade}/${e.estado}` : '—';
  }

  bairroPrincipal(c: Cliente): string {
    const e = c.enderecos?.find((x) => x.principal) ?? c.enderecos?.[0];
    return e?.bairro || '—';
  }

  generoRotulo(c: Cliente): string {
    return GENEROS.find((g) => g.valor === c.genero)?.rotulo ?? '—';
  }
}
