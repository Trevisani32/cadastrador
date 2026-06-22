import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Autenticação', () => {
  test('login inválido mostra mensagem de erro', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#lg-user').fill('admin');
    await page.locator('#lg-senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('.alerta-erro')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login com admin entra e lista os clientes semeados', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
    // Pelo menos um cliente listado (dado semeado na primeira execução do backend).
    await expect(page.locator('tbody tr td strong').first()).toBeVisible();
  });

  test('rota protegida redireciona para login quando deslogado', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page).toHaveURL(/\/login/);
  });
});
