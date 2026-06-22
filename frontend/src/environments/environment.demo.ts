// Configuração usada no build de demonstração (GitHub Pages).
// Não há backend: as chamadas /api são atendidas pelo DemoStore no navegador.
export const environment = {
  production: true,
  demoMode: true,
  apiUrl: '/api',
  viaCepUrl: 'https://viacep.com.br/ws'
};
