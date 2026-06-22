export interface LoginRequest {
  username: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  username: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  username: string;
  nome: string;
  role: string;
}

export interface EsqueciSenhaRequest {
  email: string;
}

export interface RecuperacaoResponse {
  mensagem: string;
  demo: boolean;
  codigoDemo: string;
}

export interface RedefinirSenhaRequest {
  email: string;
  codigo: string;
  novaSenha: string;
}
