import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração E2E. Sobe backend (Spring Boot) e frontend (Angular) automaticamente
 * e espera as duas portas antes de rodar os testes. Reaproveita servidores já no ar.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],

  webServer: [
    {
      // Backend: força modo demonstração para o fluxo de recuperação e usa o admin padrão.
      command: 'mvn -o spring-boot:run',
      cwd: '../backend',
      url: 'http://localhost:8080/api/clientes',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // 401 sem token confirma que o servidor está no ar e respondendo.
      ignoreHTTPSErrors: true
    },
    {
      command: 'npm start',
      cwd: '../frontend',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
