import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  EsqueciSenhaRequest,
  LoginRequest,
  RecuperacaoResponse,
  RedefinirSenhaRequest,
  RegisterRequest
} from '../models/auth.model';

const STORAGE_KEY = 'cadastrador.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  private readonly _sessao = signal<AuthResponse | null>(this.carregar());

  readonly sessao = this._sessao.asReadonly();
  readonly autenticado = computed(() => this._sessao() !== null);
  readonly nome = computed(() => this._sessao()?.nome ?? '');

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req).pipe(
      tap((resp) => this.persistir(resp))
    );
  }

  registrar(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/registrar`, req).pipe(
      tap((resp) => this.persistir(resp))
    );
  }

  esqueciSenha(req: EsqueciSenhaRequest): Observable<RecuperacaoResponse> {
    return this.http.post<RecuperacaoResponse>(`${this.base}/esqueci-senha`, req);
  }

  redefinirSenha(req: RedefinirSenhaRequest): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.base}/redefinir-senha`, req);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._sessao.set(null);
  }

  get token(): string | null {
    return this._sessao()?.token ?? null;
  }

  private persistir(resp: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resp));
    this._sessao.set(resp);
  }

  private carregar(): AuthResponse | null {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) {
      return null;
    }
    try {
      return JSON.parse(bruto) as AuthResponse;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
