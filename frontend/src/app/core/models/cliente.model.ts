export type TipoPessoa = 'FISICA' | 'JURIDICA';

export type Genero = 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'NAO_INFORMADO';

export type TipoEndereco = 'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA' | 'OUTRO';

export type TipoContato = 'TELEFONE' | 'CELULAR' | 'WHATSAPP' | 'EMAIL' | 'OUTRO';

export type TipoParentesco = 'FILHO_A' | 'CONJUGE' | 'PAI' | 'MAE' | 'IRMAO_A' | 'OUTRO';

export interface Endereco {
  id?: number;
  tipo: TipoEndereco;
  cep?: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

export interface Contato {
  id?: number;
  tipo: TipoContato;
  valor: string;
  descricao?: string;
  principal: boolean;
}

export interface Parentesco {
  id?: number;
  parenteId: number;
  parenteNome?: string;
  tipo: TipoParentesco;
  descricao?: string;
}

export interface Cliente {
  id?: number;
  nome: string;
  tipoPessoa: TipoPessoa;
  genero: Genero;
  dataNascimento?: string | null;
  observacoes?: string;
  ativo: boolean;
  enderecos: Endereco[];
  contatos: Contato[];
  parentescos: Parentesco[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const TIPOS_PESSOA: { valor: TipoPessoa; rotulo: string }[] = [
  { valor: 'FISICA', rotulo: 'Pessoa Física' },
  { valor: 'JURIDICA', rotulo: 'Pessoa Jurídica' }
];

export const GENEROS: { valor: Genero; rotulo: string }[] = [
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'OUTRO', rotulo: 'Outro' },
  { valor: 'NAO_INFORMADO', rotulo: 'Prefiro não informar' }
];

export const TIPOS_ENDERECO: { valor: TipoEndereco; rotulo: string }[] = [
  { valor: 'RESIDENCIAL', rotulo: 'Residencial' },
  { valor: 'COMERCIAL', rotulo: 'Comercial' },
  { valor: 'COBRANCA', rotulo: 'Cobrança' },
  { valor: 'ENTREGA', rotulo: 'Entrega' },
  { valor: 'OUTRO', rotulo: 'Outro' }
];

export const TIPOS_CONTATO: { valor: TipoContato; rotulo: string }[] = [
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'TELEFONE', rotulo: 'Telefone' },
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'OUTRO', rotulo: 'Outro' }
];

export const TIPOS_PARENTESCO: { valor: TipoParentesco; rotulo: string }[] = [
  { valor: 'FILHO_A', rotulo: 'Filho(a)' },
  { valor: 'CONJUGE', rotulo: 'Cônjuge / Esposo(a)' },
  { valor: 'PAI', rotulo: 'Pai' },
  { valor: 'MAE', rotulo: 'Mãe' },
  { valor: 'IRMAO_A', rotulo: 'Irmão(ã)' },
  { valor: 'OUTRO', rotulo: 'Outro' }
];
