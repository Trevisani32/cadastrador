import { Page, expect } from '@playwright/test';

/** Faz login pela UI e espera cair na lista de clientes. */
export async function login(page: Page, usuario = 'admin', senha = 'admin123') {
  await page.goto('/login');
  // IDs evitam ambiguidade com o botão "Mostrar senha".
  await page.locator('#lg-user').fill(usuario);
  await page.locator('#lg-senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/clientes/);
}

/** Cria um usuário comum (ROLE_USER) direto pela API e devolve as credenciais. */
export async function criarUsuarioComum(page: Page) {
  const sufixo = `${Date.now()}`.slice(-7);
  const credenciais = {
    nome: 'Usuário Teste',
    username: `user${sufixo}`,
    email: `user${sufixo}@teste.com`,
    senha: 'senha123'
  };
  const resp = await page.request.post('http://localhost:8080/api/auth/registrar', {
    data: credenciais
  });
  expect(resp.ok()).toBeTruthy();
  return credenciais;
}
