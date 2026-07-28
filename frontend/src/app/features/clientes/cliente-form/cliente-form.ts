import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ClienteService } from '../../../core/services/cliente.service';
import { CepError, CepService } from '../../../core/services/cep.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import {
  Cliente,
  GENEROS,
  TIPOS_CONTATO,
  TIPOS_ENDERECO,
  TIPOS_PARENTESCO,
  TIPOS_PESSOA,
  TipoContato
} from '../../../core/models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss'
})
export class ClienteForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ClienteService);
  private cepService = inject(CepService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificacao = inject(NotificacaoService);

  protected readonly tiposPessoa = TIPOS_PESSOA;
  protected readonly generos = GENEROS;
  protected readonly tiposEndereco = TIPOS_ENDERECO;
  protected readonly tiposContato = TIPOS_CONTATO;
  protected readonly tiposParentesco = TIPOS_PARENTESCO;

  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly id = signal<number | null>(null);
  protected readonly cepCarregando = signal<number | null>(null);
  /** Mensagem de erro da última consulta de CEP, por índice de endereço. */
  protected readonly cepErro = signal<{ indice: number; mensagem: string } | null>(null);

  /** Clientes disponíveis para vínculo de parentesco (exclui o próprio em edição). */
  protected readonly clientesDisponiveis = signal<{ id: number; nome: string }[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    tipoPessoa: ['FISICA' as Cliente['tipoPessoa'], Validators.required],
    genero: ['NAO_INFORMADO' as Cliente['genero'], Validators.required],
    dataNascimento: ['', Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)],
    observacoes: [''],
    ativo: [true],
    enderecos: this.fb.array<FormGroup>([]),
    contatos: this.fb.array<FormGroup>([]),
    parentescos: this.fb.array<FormGroup>([])
  });

  get enderecos(): FormArray {
    return this.form.get('enderecos') as FormArray;
  }

  get contatos(): FormArray {
    return this.form.get('contatos') as FormArray;
  }

  get parentescos(): FormArray {
    return this.form.get('parentescos') as FormArray;
  }

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    if (param) {
      this.id.set(Number(param));
      this.carregarCliente(Number(param));
    } else {
      this.adicionarEndereco();
      this.adicionarContato();
    }
    this.carregarClientesDisponiveis();
  }

  private carregarClientesDisponiveis(): void {
    this.service.listar({ tamanho: 1000 }).subscribe({
      next: (page) => {
        const atual = this.id();
        this.clientesDisponiveis.set(
          page.content
            .filter((c) => c.id != null && c.id !== atual)
            .map((c) => ({ id: c.id as number, nome: c.nome }))
        );
      }
    });
  }

  // ----- Builders -----

  novoEndereco(dados?: Partial<Cliente['enderecos'][number]>): FormGroup {
    return this.fb.nonNullable.group({
      id: [dados?.id ?? null],
      tipo: [dados?.tipo ?? 'RESIDENCIAL', Validators.required],
      cep: [dados?.cep ?? ''],
      logradouro: [dados?.logradouro ?? '', Validators.required],
      numero: [dados?.numero ?? ''],
      complemento: [dados?.complemento ?? ''],
      bairro: [dados?.bairro ?? ''],
      cidade: [dados?.cidade ?? '', Validators.required],
      estado: [dados?.estado ?? '', [Validators.required, Validators.maxLength(2)]],
      principal: [dados?.principal ?? false]
    });
  }

  novoContato(dados?: Partial<Cliente['contatos'][number]>): FormGroup {
    const grupo = this.fb.nonNullable.group({
      id: [dados?.id ?? null],
      tipo: [dados?.tipo ?? 'CELULAR', Validators.required],
      valor: [dados?.valor ?? ''],
      descricao: [dados?.descricao ?? ''],
      principal: [dados?.principal ?? false]
    });
    // Validação do "valor" muda conforme o tipo
    this.aplicarValidadorContato(grupo);
    grupo.get('tipo')!.valueChanges.subscribe(() => {
      this.aplicarValidadorContato(grupo);
      grupo.get('valor')!.updateValueAndValidity();
    });
    return grupo;
  }

  private aplicarValidadorContato(grupo: FormGroup): void {
    const tipo = grupo.get('tipo')!.value as TipoContato;
    const validadores = [Validators.required];
    if (tipo === 'EMAIL') {
      validadores.push(Validators.email);
    } else if (tipo === 'TELEFONE' || tipo === 'CELULAR' || tipo === 'WHATSAPP') {
      // Aceita máscara: dígitos, espaços, parênteses, hífen e "+" — mínimo 8 dígitos
      validadores.push(Validators.pattern(/^(?=(?:.*\d){8,})[\d\s()+-]+$/));
    }
    grupo.get('valor')!.setValidators(validadores);
  }

  novoParentesco(dados?: Partial<Cliente['parentescos'][number]>): FormGroup {
    const grupo = this.fb.nonNullable.group({
      id: [dados?.id ?? null],
      parenteId: [dados?.parenteId ?? null, Validators.required],
      tipo: [dados?.tipo ?? 'FILHO_A', Validators.required],
      descricao: [dados?.descricao ?? '']
    });
    // A descrição só é obrigatória quando o parentesco é "Outro"
    this.aplicarValidadorParentesco(grupo);
    grupo.get('tipo')!.valueChanges.subscribe(() => {
      this.aplicarValidadorParentesco(grupo);
      grupo.get('descricao')!.updateValueAndValidity();
    });
    return grupo;
  }

  private aplicarValidadorParentesco(grupo: FormGroup): void {
    const descricao = grupo.get('descricao')!;
    if (this.ehOutroParentesco(grupo)) {
      descricao.setValidators([Validators.required]);
    } else {
      descricao.clearValidators();
    }
  }

  ehOutroParentesco(grupo: AbstractControl): boolean {
    return grupo.get('tipo')?.value === 'OUTRO';
  }

  // ----- Ações de listas -----

  adicionarEndereco(): void {
    this.enderecos.push(this.novoEndereco({ principal: this.enderecos.length === 0 }));
  }
  removerEndereco(i: number): void {
    this.enderecos.removeAt(i);
  }

  adicionarContato(): void {
    this.contatos.push(this.novoContato({ principal: this.contatos.length === 0 }));
  }
  removerContato(i: number): void {
    this.contatos.removeAt(i);
  }

  adicionarParentesco(): void {
    this.parentescos.push(this.novoParentesco());
  }
  removerParentesco(i: number): void {
    this.parentescos.removeAt(i);
  }

  marcarEnderecoPrincipal(i: number): void {
    this.enderecos.controls.forEach((c, idx) => c.get('principal')?.setValue(idx === i));
  }
  marcarContatoPrincipal(i: number): void {
    this.contatos.controls.forEach((c, idx) => c.get('principal')?.setValue(idx === i));
  }

  // ----- CEP (ViaCEP) -----

  buscarCep(i: number): void {
    const grupo = this.enderecos.at(i);
    const cep = (grupo.get('cep')?.value ?? '').replace(/\D/g, '');
    this.cepErro.set(null);
    if (cep.length !== 8) {
      return;
    }
    this.cepCarregando.set(i);
    this.cepService.consultar(cep).subscribe({
      next: (resp) => {
        this.cepCarregando.set(null);
        // Ignora respostas fora de ordem: só aplica se o CEP do campo não mudou.
        const cepAtual = (grupo.get('cep')?.value ?? '').replace(/\D/g, '');
        if (cepAtual !== cep) {
          return;
        }
        grupo.patchValue({
          logradouro: resp.logradouro || grupo.get('logradouro')?.value,
          bairro: resp.bairro || grupo.get('bairro')?.value,
          cidade: resp.localidade || grupo.get('cidade')?.value,
          estado: resp.uf || grupo.get('estado')?.value
        });
      },
      error: (e: unknown) => {
        this.cepCarregando.set(null);
        const mensagem = e instanceof CepError ? e.message : 'Não foi possível consultar o CEP.';
        this.cepErro.set({ indice: i, mensagem });
      }
    });
  }

  // ----- Carregar / salvar -----

  placeholderContato(grupo: FormGroup): string {
    const tipo = grupo.get('tipo')?.value as TipoContato;
    return tipo === 'EMAIL' ? 'email@exemplo.com' : '(00) 00000-0000';
  }

  ehTelefone(grupo: AbstractControl): boolean {
    const tipo = grupo.get('tipo')?.value as TipoContato;
    return tipo === 'TELEFONE' || tipo === 'CELULAR';
  }

  /** Aplica a máscara de telefone enquanto o usuário digita, quando o tipo for telefone/celular. */
  aoDigitarContato(grupo: AbstractControl): void {
    if (!this.ehTelefone(grupo)) {
      return;
    }
    const ctrl = grupo.get('valor')!;
    ctrl.setValue(this.formatarTelefone(ctrl.value), { emitEvent: false });
  }

  private formatarTelefone(valor: string): string {
    const d = (valor ?? '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  /** Aplica a máscara de data dd/mm/aaaa enquanto digita. */
  aoDigitarData(): void {
    const ctrl = this.form.get('dataNascimento')!;
    const d = (ctrl.value ?? '').replace(/\D/g, '').slice(0, 8);
    let formatado = d;
    if (d.length > 4) {
      formatado = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    } else if (d.length > 2) {
      formatado = `${d.slice(0, 2)}/${d.slice(2)}`;
    }
    ctrl.setValue(formatado, { emitEvent: false });
  }

  private brParaIso(valor: string): string | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((valor ?? '').trim());
    return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
  }

  private isoParaBr(valor?: string | null): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }

  private carregarCliente(id: number): void {
    this.carregando.set(true);
    this.service.buscar(id).subscribe({
      next: (c) => {
        this.form.patchValue({
          nome: c.nome,
          tipoPessoa: c.tipoPessoa,
          genero: c.genero ?? 'NAO_INFORMADO',
          dataNascimento: this.isoParaBr(c.dataNascimento),
          observacoes: c.observacoes ?? '',
          ativo: c.ativo
        });
        c.enderecos?.forEach((e) => this.enderecos.push(this.novoEndereco(e)));
        c.contatos?.forEach((ct) => this.contatos.push(this.novoContato(ct)));
        c.parentescos?.forEach((p) => this.parentescos.push(this.novoParentesco(p)));
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Cliente não encontrado.');
        this.carregando.set(false);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Verifique os campos obrigatórios destacados.');
      return;
    }
    this.salvando.set(true);
    this.erro.set(null);

    const valor = this.form.getRawValue();
    const payload = {
      ...valor,
      dataNascimento: this.brParaIso(valor.dataNascimento)
    } as unknown as Cliente;

    const id = this.id();
    const obs = id ? this.service.atualizar(id, payload) : this.service.criar(payload);

    obs.subscribe({
      next: () => {
        this.notificacao.sucesso(id ? 'Cliente atualizado com sucesso.' : 'Cliente salvo com sucesso.');
        this.router.navigate(['/clientes']);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(e.error?.mensagem ?? 'Não foi possível salvar o cliente.');
      }
    });
  }

  campoInvalido(nome: string): boolean {
    const c = this.form.get(nome);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
