import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Busca de CEP (ViaCEP)', () => {
  test('preenche endereço automaticamente ao informar o CEP', async ({ page }) => {
    // Mocka a ViaCEP para o teste ser determinístico e não depender de rede externa.
    await page.route('**/viacep.com.br/**', (route) =>
      route.fulfill({
        json: {
          cep: '13010-001',
          logradouro: 'Rua das Flores',
          complemento: '',
          bairro: 'Centro',
          localidade: 'Campinas',
          uf: 'SP'
        }
      })
    );

    await login(page);
    await page.getByRole('link', { name: '+ Novo cliente' }).click();
    await expect(page).toHaveURL(/\/clientes\/novo/);

    const cep = page.getByPlaceholder('00000-000', { exact: true });
    await cep.fill('13010001');
    await cep.blur();

    const logradouro = page.locator('.campo', { hasText: 'Logradouro' }).getByRole('textbox');
    const cidade = page.locator('.campo', { hasText: 'Cidade' }).getByRole('textbox');

    await expect(logradouro).toHaveValue('Rua das Flores');
    await expect(cidade).toHaveValue('Campinas');
  });

  test('CEP inexistente exibe mensagem de erro', async ({ page }) => {
    await page.route('**/viacep.com.br/**', (route) => route.fulfill({ json: { erro: true } }));

    await login(page);
    await page.getByRole('link', { name: '+ Novo cliente' }).click();

    const cep = page.getByPlaceholder('00000-000', { exact: true });
    await cep.fill('00000000');
    await cep.blur();

    await expect(page.locator('.erro-campo')).toContainText('não encontrado');
  });
});
