import { Component, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

type Tela = 'login' | 'cadastro' | 'recuperar';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly tela = signal<Tela>('login');
  protected readonly mostrarSenha = signal(false);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly sucesso = signal<string | null>(null);

  // Recuperação de senha
  protected readonly etapaRecuperacao = signal<1 | 2>(1);
  protected readonly codigoDemo = signal<string | null>(null);

  // Código de verificação em 8 caixas separadas
  protected readonly indices = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly digitos = signal<string[]>(Array(8).fill(''));
  @ViewChildren('caixaCodigo') caixas!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly formLogin = this.fb.nonNullable.group({
    username: ['', Validators.required],
    senha: ['', Validators.required]
  });

  protected readonly formCadastro = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly formEsqueci = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected readonly formRedefinir = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]]
  });

  irPara(tela: Tela): void {
    this.erro.set(null);
    this.sucesso.set(null);
    this.mostrarSenha.set(false);
    this.etapaRecuperacao.set(1);
    this.codigoDemo.set(null);
    this.limparCodigo();
    this.tela.set(tela);
  }

  // ----- Código de verificação (8 caixas) -----

  private limparCodigo(): void {
    this.digitos.set(Array(8).fill(''));
    this.formRedefinir.get('codigo')!.setValue('');
  }

  private sincronizarCodigo(): void {
    this.formRedefinir.get('codigo')!.setValue(this.digitos().join(''));
  }

  private focar(indice: number): void {
    const alvo = this.caixas?.get(indice)?.nativeElement;
    if (alvo) {
      alvo.focus();
      alvo.select();
    }
  }

  aoDigitar(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const apenasDigito = input.value.replace(/\D/g, '').slice(-1);
    const arr = [...this.digitos()];
    arr[indice] = apenasDigito;
    this.digitos.set(arr);
    input.value = apenasDigito;
    this.sincronizarCodigo();
    if (apenasDigito && indice < 7) {
      this.focar(indice + 1);
    }
  }

  aoTeclar(indice: number, evento: KeyboardEvent): void {
    if (evento.key === 'Backspace') {
      if (!this.digitos()[indice] && indice > 0) {
        evento.preventDefault();
        const arr = [...this.digitos()];
        arr[indice - 1] = '';
        this.digitos.set(arr);
        this.sincronizarCodigo();
        this.focar(indice - 1);
      }
    } else if (evento.key === 'ArrowLeft' && indice > 0) {
      this.focar(indice - 1);
    } else if (evento.key === 'ArrowRight' && indice < 7) {
      this.focar(indice + 1);
    }
  }

  aoColar(evento: ClipboardEvent): void {
    evento.preventDefault();
    const texto = (evento.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 8);
    if (!texto) {
      return;
    }
    const arr = Array(8).fill('');
    for (let i = 0; i < texto.length; i++) {
      arr[i] = texto.charAt(i);
    }
    this.digitos.set(arr);
    this.sincronizarCodigo();
    this.focar(Math.min(texto.length, 7));
  }

  alternarSenha(): void {
    this.mostrarSenha.update((v) => !v);
  }

  entrar(): void {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }
    this.iniciar();
    this.auth.login(this.formLogin.getRawValue()).subscribe({
      next: () => this.router.navigate(['/clientes']),
      error: (e) => this.falhar(e, 'Usuário ou senha inválidos.')
    });
  }

  cadastrar(): void {
    if (this.formCadastro.invalid) {
      this.formCadastro.markAllAsTouched();
      return;
    }
    this.iniciar();
    this.auth.registrar(this.formCadastro.getRawValue()).subscribe({
      next: () => this.router.navigate(['/clientes']),
      error: (e) => this.falhar(e, 'Não foi possível concluir o cadastro.')
    });
  }

  solicitarCodigo(): void {
    if (this.formEsqueci.invalid) {
      this.formEsqueci.markAllAsTouched();
      return;
    }
    this.iniciar();
    this.auth.esqueciSenha(this.formEsqueci.getRawValue()).subscribe({
      next: (resp) => {
        this.carregando.set(false);
        this.codigoDemo.set(resp.demo ? resp.codigoDemo : null);
        this.etapaRecuperacao.set(2);
      },
      error: (e) => this.falhar(e, 'Não foi possível gerar o código.')
    });
  }

  redefinir(): void {
    if (this.formRedefinir.invalid) {
      this.formRedefinir.markAllAsTouched();
      return;
    }
    this.iniciar();
    const { codigo, novaSenha } = this.formRedefinir.getRawValue();
    this.auth.redefinirSenha({ email: this.formEsqueci.getRawValue().email, codigo, novaSenha }).subscribe({
      next: (resp) => {
        this.carregando.set(false);
        this.formRedefinir.reset();
        this.irPara('login');
        this.sucesso.set(resp.mensagem);
      },
      error: (e) => this.falhar(e, 'Não foi possível redefinir a senha.')
    });
  }

  private iniciar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);
  }

  private falhar(e: HttpErrorResponse, padrao: string): void {
    this.carregando.set(false);
    this.erro.set(e.error?.mensagem ?? padrao);
  }
}
