import { test, expect } from '@playwright/test';
import { login, criarUsuarioComum } from './helpers';

test.describe('Autorização por papel (DELETE restrito a ADMIN)', () => {
  test('usuário comum é bloqueado ao excluir e NÃO é deslogado (403 ≠ logout)', async ({ page }) => {
    const usuario = await criarUsuarioComum(page);

    // Aceita o confirm() nativo da exclusão.
    page.on('dialog', (dialog) => dialog.accept());

    await login(page, usuario.username, usuario.senha);

    const primeiroNome = await page.locator('tbody tr td strong').first().textContent();
    await page.getByRole('button', { name: 'Excluir' }).first().click();

    // Graças à correção do interceptor, o 403 mantém a sessão (não redireciona para /login).
    await expect(page.locator('.alerta-erro')).toBeVisible();
    await expect(page).toHaveURL(/\/clientes/);
    await expect(page).not.toHaveURL(/\/login/);
    // O cliente continua na lista — a exclusão foi de fato bloqueada.
    await expect(page.getByText(primeiroNome!.trim())).toBeVisible();
  });

  test('API: DELETE de cliente por usuário comum retorna 403', async ({ page }) => {
    const usuario = await criarUsuarioComum(page);
    const resp = await page.request.post('http://localhost:8080/api/auth/login', {
      data: { username: usuario.username, senha: usuario.senha }
    });
    const { token } = await resp.json();

    const del = await page.request.delete('http://localhost:8080/api/clientes/1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(del.status()).toBe(403);
  });
});
