import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CepError, CepService, ViaCepResposta } from './cep.service';
import { environment } from '../../../environments/environment';

describe('CepService', () => {
  let service: CepService;
  let http: HttpTestingController;

  const respostaOk: ViaCepResposta = {
    cep: '13010-001',
    logradouro: 'Rua das Flores',
    complemento: '',
    bairro: 'Centro',
    localidade: 'Campinas',
    uf: 'SP'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CepService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CepService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta a ViaCEP com o CEP sem máscara', () => {
    let recebido: ViaCepResposta | undefined;
    service.consultar('13010-001').subscribe((r) => (recebido = r));

    const req = http.expectOne(`${environment.viaCepUrl}/13010001/json/`);
    expect(req.request.method).toBe('GET');
    req.flush(respostaOk);

    expect(recebido?.localidade).toBe('Campinas');
  });

  it('não chama a API quando o CEP não tem 8 dígitos', () => {
    let erro: unknown;
    service.consultar('123').subscribe({ error: (e) => (erro = e) });

    http.expectNone(() => true);
    expect(erro).toBeInstanceOf(CepError);
  });

  it('transforma o "erro 200" da ViaCEP em CepError', () => {
    let erro: unknown;
    service.consultar('00000000').subscribe({ error: (e) => (erro = e) });

    http.expectOne(`${environment.viaCepUrl}/00000000/json/`).flush({ erro: true });

    expect(erro).toBeInstanceOf(CepError);
    expect((erro as CepError).message).toContain('não encontrado');
  });
});
