import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './services/auth.service';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }])
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    // Simula um usuário logado com token.
    const auth = TestBed.inject(AuthService);
    Object.defineProperty(auth, 'token', { get: () => 'jwt-de-teste' });
  });

  afterEach(() => httpMock.verify());

  it('anexa o Authorization em chamadas da própria API', () => {
    http.get(`${environment.apiUrl}/clientes`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/clientes`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-de-teste');
    req.flush([]);
  });

  it('NÃO anexa o token em chamadas para domínios externos (ViaCEP)', () => {
    http.get('https://viacep.com.br/ws/13010001/json/').subscribe();

    const req = httpMock.expectOne('https://viacep.com.br/ws/13010001/json/');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('faz logout quando a API responde 401 (não autenticado)', () => {
    const auth = TestBed.inject(AuthService);
    let deslogou = false;
    auth.logout = () => { deslogou = true; };

    http.get(`${environment.apiUrl}/clientes`).subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.apiUrl}/clientes`)
      .flush('', { status: 401, statusText: 'Unauthorized' });

    expect(deslogou).toBe(true);
  });

  it('NÃO faz logout quando a API responde 403 (autenticado, sem permissão)', () => {
    const auth = TestBed.inject(AuthService);
    let deslogou = false;
    auth.logout = () => { deslogou = true; };

    http.delete(`${environment.apiUrl}/clientes/1`).subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.apiUrl}/clientes/1`)
      .flush('', { status: 403, statusText: 'Forbidden' });

    expect(deslogou).toBe(false);
  });
});
